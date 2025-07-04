var jsPsychPavlovia = (function (jspsych) {
    "use strict";

    /**
	 * The version number.
	 *
	 * @type {string}
	 * @public
	 */
	const version = '5.0.0';

    /**
     * The default error callback function.
     *
     * Error messages are displayed in the body of the document and in the browser's console.
     *
     * @param {Object} error - the error json object to be displayed.
     * @public
     */
    const defaultErrorCallback = function (error) {
        // output the error to the console:
        console.error('[pavlovia ' + version + ']', error);

        // output the error to the html body:
        let htmlCode = '<h3>[jspsych-pavlovia plugin ' + version + '] Error</h3><ul>';
        while (true) {
            if (typeof error === 'object' && 'context' in error) {
                htmlCode += '<li>' + error.context + '</li>';
                error = error.error;
            } else {
                htmlCode += '<li><b>' + error + '</b></li>';
                break;
            }
        }
        htmlCode += '</ul>';
        document.querySelector('body').innerHTML = htmlCode;
    };

    const info = {
        name: 'pavlovia',
        version: version,
        data: {},
        description: 'communication with pavlovia.org',
        parameters: {
            command: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Command',
                default: 'init',
                description: 'The pavlovia command: "init" (default) or "finish"'
            },
            participantId: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Participant Id',
                default: 'PARTICIPANT',
                description: 'The participant Id: "PARTICIPANT" (default) or any string'
            },
            errorCallback: {
                type: jspsych.ParameterType.FUNCTION,
                pretty_name: 'ErrorCallback',
                default: defaultErrorCallback,
                description: 'The callback function called whenever an error has occurred'
            }
        }
    };

    /**
     * **PLUGIN-NAME**
     *
     * SHORT PLUGIN DESCRIPTION
     *
     * @author YOUR NAME
     * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
     */
    class PavloviaPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial = (display_element, trial) => {
            // execute the command:
            switch (trial.command.toLowerCase()) {
                case 'init':
                    _init(trial);
                    break;

                case 'finish':
                    const data = this.jsPsych.data.get().csv();
                    _finish(trial, data);
                    break;

                default:
                    trial.errorCallback('unknown command: ' + trial.command);
            }

            // end trial
            this.jsPsych.finishTrial();
        }
    }
    PavloviaPlugin.info = info;

    /**
     * The pavlovia.org configuration (usually read from the config.json configuration file).
     *
     * @type {Object}
     * @private
     */
    let _config = {};


    /**
     * The callback for the beforeunload event, which is triggered when the participant tries to leave the
     * experiment by closing the tab or browser.
     *
     * @type {null}
     * @private
     */
    let _beforeunloadCallback = null;


    /**
     * The server paramaters (those starting with a double underscore).
     * @type {Object}
     * @private
     */
    let _serverMsg = new Map();


    /**
     * Initialise the connection with pavlovia.org: configure the plugin and open a new session.
     *
     * @param {Object} trial - the jsPsych trial
     * @param {string} [configURL= "config.json"] - the URL of the pavlovia.org json configuration file
     * @returns {Promise<void>}
     * @private
     */
    const _init = async (trial, configURL = 'config.json') => {
        try {
            // configure:
            let response = await _configure(configURL);
            _config = response.config;
            _log('init | _configure.response=', response);

            // open a new session:
            response = await _openSession();
            // _config.experiment.token = response.token;
            _log('init | _openSession.response=', response);

            // warn the user when they attempt to close the tab or browser:
            _beforeunloadCallback = (event) => {
                // preventDefault should ensure that the user gets prompted:
                event.preventDefault();

                // Chrome requires returnValue to be set:
                event.returnValue = '';
            };
            window.addEventListener('beforeunload', _beforeunloadCallback);


            // when the user closes the tab or browser, we attempt to close the session and optionally save the results
            // note: we communicate with the server using the Beacon API
            window.addEventListener('unload', (event) => {
                if (_config.session.status === 'OPEN') {
                    // get and save the incomplete results if need be:
                    if (_config.experiment.saveIncompleteResults) {
                        // use the jspsych instance from outer scope
                        const data = jspsych.data.get().csv();
                        _save(trial, data, true);
                    }

                    // close the session:
                    _closeSession(false, true);
                }
            });
        }
        catch (error) {
            trial.errorCallback(error);
        }
    };


    /**
     * Finish the connection with pavlovia.org: upload the collected data and close the session.
     *
     * @param {Object} trial - the jsPsych trial
     * @param {Object} data - the experiment data to be uploaded
     * @returns {Promise<void>}
     * @private
     */
    const _finish = async function (trial, data) {
        try {
            // remove the beforeunload listener:
            window.removeEventListener('beforeunload', _beforeunloadCallback);

            // upload the data to pavlovia.org:
            let response = await _save(trial, data, false);
            _log('finish | _save.response=', response);

            // close the session:
            response = await _closeSession(true, false);
            _log('finish | _closeSession.response=', response);
        }
        catch (error) {
            trial.errorCallback(error);
        }
    };


    /**
     * Configure the plugin by reading the configuration file created upon activation of the experiment.
     *
     * @param {string} [configURL= "config.json"] - the URL of the pavlovia.org json configuration file
     * @returns {Promise<any>}
     * @private
     */
    const _configure = async function (configURL) {
        let response = { origin: '_configure', context: 'when configuring the plugin' };

        try {
            const configurationResponse = await _getConfiguration(configURL);

            // legacy experiments had a psychoJsManager block instead of a pavlovia block, and the URL
            // pointed to https://pavlovia.org/server
            if ('psychoJsManager' in configurationResponse.config) {
                delete configurationResponse.config.psychoJsManager;
                configurationResponse.config.pavlovia = {
                    URL: 'https://pavlovia.org'
                };
            }

            // tests for the presence of essential blocks in the configuration:
            if (!('experiment' in configurationResponse.config))
                throw 'missing experiment block in configuration';
            if (!('name' in configurationResponse.config.experiment))
                throw 'missing name in experiment block in configuration';
            if (!('fullpath' in configurationResponse.config.experiment))
                throw 'missing fullpath in experiment block in configuration';
            if (!('pavlovia' in configurationResponse.config))
                throw 'missing pavlovia block in configuration';
            if (!('URL' in configurationResponse.config.pavlovia))
                throw 'missing URL in pavlovia block in configuration';

            // get the server parameters (those starting with a double underscore):
            const urlQuery = window.location.search.slice(1);
            const urlParameters = new URLSearchParams(urlQuery);
            urlParameters.forEach((value, key) => {
                if (key.indexOf('__') === 0)
                    _serverMsg.set(key, value);
            });

            return configurationResponse;
        }
        catch (error) {
            throw { ...response, error };
        }
    };


    /**
     * Get the pavlovia.org json configuration file.
     *
     * @param {string} configURL - the URL of the pavlovia.org json configuration file
     * @returns {Promise<any>}
     * @private
     */
    const _getConfiguration = async function (configURL) {
        const responseInfo = { origin: '_getConfiguration', context: 'when reading the configuration file: ' + configURL };
        try {
            const resp = await fetch(configURL, { cache: 'no-cache' });
            if (!resp.ok) throw `${resp.status} ${resp.statusText}`;
            const config = await resp.json();
            return { ...responseInfo, config };
        } catch (error) {
            throw { ...responseInfo, error };
        }
    };


    /**
     * Open a new session for this experiment on pavlovia.org.
     *
     * @returns {Promise<any>}
     * @private
     */
    const _openSession = function () {
        let response = {
            origin: '_openSession',
            context: 'when opening a session for experiment: ' + _config.experiment.fullpath
        };

        // prepare POST query:
        let data = {};
        if (_serverMsg.has('__pilotToken'))
            data.pilotToken = _serverMsg.get('__pilotToken');

        // query pavlovia server:
        return new Promise((resolve, reject) => {
            const url = _config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(_config.experiment.fullpath) + '/sessions';
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(async (res) => {
                    if (!res.ok) throw await res.text();
                    const serverData = await res.json();

                    // validate
                    if (!('token' in serverData) || !('experiment' in serverData)) {
                        reject(Object.assign(response, { error: 'unexpected answer from server' }));
                    }

                    // update config
                    _config.session = { token: serverData.token, status: 'OPEN' };
                    _config.experiment.status = serverData.experiment.status2;
                    _config.experiment.saveFormat = Symbol.for(serverData.experiment.saveFormat);
                    _config.experiment.saveIncompleteResults = serverData.experiment.saveIncompleteResults;
                    _config.experiment.license = serverData.experiment.license;
                    _config.runMode = serverData.experiment.runMode;

                    resolve(Object.assign(response, { token: serverData.token, status: serverData.status }));
                })
                .catch((error) => {
                    reject(Object.assign(response, { error }));
                });
        });
    };


    /**
     * Close the previously opened session on pavlovia.org.
     *
     * @param {boolean} isCompleted - whether or not the participant completed the experiment
     * @param {boolean} [sync = false] - whether or not to use the Beacon API to comminucate with the server
     * @private
     */
    const _closeSession = function (isCompleted = true, sync = false) {
        let response = {
            origin: '_closeSession',
            context: 'when closing the session for experiment: ' + _config.experiment.fullpath
        };

        // prepare DELETE query:
        const url = _config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(_config.experiment.fullpath) + '/sessions/' + _config.session.token;

        // synchronous query the pavlovia server:
        if (sync) {
            const formData = new FormData();
            formData.append('isCompleted', isCompleted);
            navigator.sendBeacon(url + '/delete', formData);
            _config.session.status = 'CLOSED';
        }
        else {
            // asynchronously query the pavlovia server:
            return fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted })
            })
                .then(async (res) => {
                    if (!res.ok) throw await res.text();
                    const data = await res.json();
                    _config.session.status = 'CLOSED';
                    return Object.assign(response, { data });
                })
                .catch((error) => {
                    throw Object.assign(response, { error });
                });
        }
    };


    /**
     * Upload data to the pavlovia.org server.
     *
     * @param {Object} trial - the jsPsych trial
     * @param {string} data - the experiment data to be uploaded
     * @param {boolean} [sync = false] - whether or not to use the Beacon API to communicate with the server
     * @return {Promise<any>}
     * @private
     */
    const _save = async function (trial, data, sync = false) {
        const date = new Date();
        let dateString = date.getFullYear() + '-' + ('0' + (1 + date.getMonth())).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '_';
        dateString += ('0' + date.getHours()).slice(-2) + 'h' + ('0' + date.getMinutes()).slice(-2) + '.' + ('0' + date.getSeconds()).slice(-2) + '.' + date.getMilliseconds();

        const key = _config.experiment.name + '_' + trial.participantId + '_' + 'SESSION' + '_' + dateString + '.csv';

        if (_config.experiment.status === 'RUNNING' && !_serverMsg.has('__pilotToken')) {
            return await _uploadData(key, data, sync);
        }
        else {
            _offerDataForDownload(key, data, 'text/csv');
            return {
                origin: '_save',
                context: 'when saving results for experiment: ' + _config.experiment.fullpath,
                message: 'offered the .csv file for download'
            };
        }
    };


    /**
     * Upload data (a key/value pair) to pavlovia.org.
     *
     * @param {string} key - the key
     * @param {string} value - the value
     * @param {boolean} [sync = false] - whether or not to upload the data using the Beacon API
     * @returns {Promise<any>}
     * @private
     */
    const _uploadData = function (key, value, sync = false) {
        let response = {
            origin: '_uploadData',
            context: 'when uploading participant\' results for experiment: ' + _config.experiment.fullpath
        };

        const url = _config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(_config.experiment.fullpath) + '/sessions/' + _config.session.token + '/results';

        // synchronous query the pavlovia server:
        if (sync) {
            const formData = new FormData();
            formData.append('key', key);
            formData.append('value', value);
            navigator.sendBeacon(url, formData);
        }
        // asynchronously query the pavlovia server:
        else {
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            })
                .then(async (res) => {
                    if (!res.ok) throw await res.text();
                    const serverData = await res.json();
                    return Object.assign(response, { serverData });
                })
                .catch((error) => {
                    throw Object.assign(response, { error });
                });
        }
    };


    /**
     * Log messages to the browser's console.
     *
     * @param {...*} messages - the messages to be displayed in the browser's console
     * @private
     */
    const _log = function (...messages) {
        console.log('[pavlovia ' + version + ']', ...messages);
    };


    /**
     * Offer data as download in the browser.
     *
     * @param {string} filename - the name of the file to be downloaded
     * @param {*} data - the data
     * @param {string} type - the MIME type of the data, e.g. 'text/csv' or 'application/json'
     * @private
     */
    const _offerDataForDownload = function (filename, data, type) {
        const blob = new Blob([data], { type });

        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    };

    // Export wrapper so experiment.js can create trials easily
    class Pavlovia {
        init(){
            return { type: jsPsychPavlovia, command: 'init', participantId: 'PARTICIPANT' };
        }
        finish(){
            return { type: jsPsychPavlovia, command: 'finish', participantId: 'PARTICIPANT' };
        }
    }
    // make globally accessible
    if (typeof window !== 'undefined') {
        window.Pavlovia = Pavlovia;
    }

    return PavloviaPlugin;
})(jsPsychModule);