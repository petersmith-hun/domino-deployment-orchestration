Domino 
======

Domino (abbreviation for '**D**eployment **O**rchestration for **M**inor **I**nfrastructures, powered by **No**de.js') is
an experimental project for those who
 * are operating their own application stack on a non-managed environment (e.g. self-configured VPS);
 * have a relatively small application stack that needs a centralized deployment management solution;
 * want to have an easy-to-use application managing the deployment of their own applications;
 * and don't want to waste time (and money) on configuring and operating complex deployment management solutions.

Domino was initially designed to serve the purposes above, and is a (soon-to-be) deployment management solution for the
[Leaflet blog engine stack](https://github.com/petersmith-hun/leaflet-backend).

# Key features

1) **REST API**  
Features of Domino are accessible via its REST interface.

2) **Configurability**  
Domino provides a variety of configuration options, so it can be aligned for your own needs and environment.

3) **Uploading executable**  
In case your CI pipeline compiles standalone executable binaries (instead of e.g. Docker images), it is possible to
upload it to the host via Domino.

4) **Lifecycle management**  
Domino provides 4 commands (deploy, start, stop, restart) to handle your registered applications via the provided REST API.

5) **Secured access**  
All the endpoints of Domino are secured with JWT-based authentication. The service account can be configured in
Domino's configuration file.

6) **CLI tool**  
There's also a [CLI tool](https://github.com/petersmith-hun/domino-cli/) specifically created for Domino, providing
easy access to Domino's lifecycle management commands, helping to properly create application registration configurations,
encrypting your management account password, etc.

# Requirements

* Linux server OS (tested on Debian 8 and 9, Ubuntu should also be fine)
* Node.js 12.x runtime environment or above

# Installation

Currently Domino can be installed manually. Please follow the guide below to properly install and start using Domino:
1) Clone/download Domino from its [GitHub repository](https://github.com/petersmith-hun/domino-deployment-orchestration).
2) Create a folder under Domino's root folder, named `logs`.
3) Configure Domino via `config/default.yml` - for the accepted configuration parameters, please consult the 
[Configuration](#Configuration) section of this documentation.
4) Register your applications in your defined Domino registrations file. The default is `config/domino-registrations.yml`.
To create the registrations please follow the guide under the [Configuration](#Configuration) section of this documentation,
or use the [Domino CLI tool's](https://github.com/petersmith-hun/domino-cli/#configuration-wizards) corresponding wizard.
5) To initialize 'node_modules' please run `npm install`.
6) To start Domino use either of the following methods below:
    1) Run `npm start`.
    2) Run `node src/domino_esm_start.js`.
    3) Install PM2 and run `pm2 start src/ecosystem.config.js`.
    4) Create a `systemd` or `init.d` service descriptor. Below is an example for the former one:
    ```
   [Unit]
   Description=Domino
   
   [Service]
   User=root
   WorkingDirectory=/path/to/domino/folder
   Environment=NODE_ENV=production NODE_CONFIG_DIR=/path/to/config/dir
   ExecStart=node src/domino_esm_start.js
   SuccessExitStatus=143
   TimeoutStopSec=10
   Restart=no
   
   [Install]
   WantedBy=multi-user.target
    ``` 
   
**Important notice**: Currently Domino needs to be executed as root due to its requirements for elevated commands, such as
spawning and killing processes, changing ownership and permissions, etc.. It's for sure an undesired requirement, and so
it has the necessary focus to have it eliminated as soon as possible. As it might require a complete redesign of the app's
command execution solutions, it will definitely take a while though. Please start using Domino accordingly!

# Configuration

Domino can be configured via yml configuration files, placed in its primary configuration folder (specified by 
`NODE_CONFIG_DIR` environment variable, defaults to `./config`). Default configuration can be provided in default.yml,
for environment related overrides, please create the resembling configuration yml files.

E.g. environment is 'production' (specified by `NODE_ENV=production`), therefore production overrides can be placed in
a configuration file named `production.yml`.

Configuration can be divided into the following for sections (with their relevant configuration parameters and details):
_(Please note, that default.yml already contains some hints about the usage of the configuration parameters.)_

## System configuration

These are some basic controls for the application itself.

| Parameter                                     | Description                                                                                                   |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `domino.system.registrations-path`            | Absolute/relative path to the configuration file containing the application registrations.                    |
| `domino.system.logging.logfile`               | Absolute/relative path to Domino's log file. Leave it empty or remove the parameter to turn off file logging. |
| `domino.system.logging.tlp-logging.enabled`   | Enable/Disable log exposure to [Tiny Log Processor (TLP)](https://github.com/petersmith-hun/leaflet-tlp/).    |
| `domino.system.logging.tlp-logging.host`      | TLP host (full absolute URL).                                                                                 |
| `domino.system.spawn-control.service-handler` | Service handler system for service-execution applications. Currently supported: `systemd`.                    |
| `domino.system.spawn-control.start-timeout`   | Max wait time on restart between stopping and starting the application.                                       |

## Server configuration

Configuration parameters for Domino's internal web server.

| Parameter            | Description                                                                                                       |
|----------------------|-------------------------------------------------------------------------------------------------------------------|
| `domino.server.host` | Host address on which Domino should listen. Specify `0.0.0.0` to listen on all addresses. Defaults to `localhost` |
| `domino.server.port` | Port on which Domino should listen. Defaults to `9987`.                                                           |

## Storage configuration

Application executable binary storage related configuration parameters.

| Parameter                            | Description                                                                                                                                                                   |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `domino.storage.enable-upload`       | Enables/disables `POST /upload` endpoint. Not needed for non-filesystem based sources, and not needed in case executables are copied to the server via SSH or any other ways. |
| `domino.storage.accepted-mime-types` | List of acceptable MIME types by upload endpoint.                                                                                                                             |
| `domino.storage.max-size`            | Maximum file size of executables uploaded via upload endpoint.                                                                                                                |
| `domino.storage.path`                | Absolute/relative path of executable storage. In this folder all uploaded executables are stored (with versions) until cleared.                                               |

## Authentication configuration

Access controls.

| Parameter                     | Description                                                                                                                            |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `domino.auth.expiration`      | Access token expiration in [ms utility](https://github.com/zeit/ms#readme) compatible format.                                          |
| `domino.auth.jwt-private-key` | JWT signing private key (HMAC SHA encrypting is used).                                                                                 |
| `domino.auth.username`        | Domino management account username.                                                                                                    |
| `domino.auth.password`        | Domino management account password. Password must be encrypted before provided here. For encryption it is suggested to use Domino CLI. |
| `domino.auth.allowed-sources` | List of allowed remote addresses accessing Domino. Specify `ALL` to turn off remote address verification.                              |

# Application registrations

TODO

# Usage

Domino can be used via its REST API. This API can be used with any REST-capable clients (curl, Postman, any custom HTTP 
client implementation, etc.). The recommended way however is to use the aforementioned Domino CLI. 

The following group of endpoints are provided at this point: 

## Authentication

```
POST /claim-token
```

Token claim endpoint can be used to generate a JWT token based on the provided management account access credentials.
The credentials should already be provided under `domino.auth.username` and `domino.auth.password` configuration parameters.

Request body must contain the credentials. Example request (for manual usage):
```
{
    "username": "management-account",
    "password": "P4$$w0rd
}
``` 

The generated JWT token is provided in the response body:

```
{
    "jwt": "<...token...>"
}
```

Possible response statuses:

| Status          | Description                |
|-----------------|----------------------------|
| `201 Created`   | Successfully authenticated |
| `403 Forbidden` | Failed to authenticate     | 

This endpoint is the only one that is accessible without a JWT token (obviously). All the other endpoints require a valid,
non-expired access token, provided as `Authorization: Bearer <token>` header parameter.

## Executable upload endpoint

```
POST /upload/{app}/{version}[?autodeploy=true[&autostart=true]]
```

The upload endpoint lets you upload your executable binaries to the server. A common use case can be an external CI software uploading the built artifacts via this endpoint.

The endpoint requires the name of an already registered application, and the version of the executable to be uploaded.
With these pieces of information the logic generates a filename in the format of `executable-<app>-v<version>.<ext>`.
This format is crucial for Domino to find the proper version of the uploaded binaries later, during the deployment phase.
In case you want to use your own method to copy the binaries to the server, please make sure your solution follows the 
pattern above. The received binary is then moved to the specified storage folder (`domino.storage.path`).

The binaries should be sent as a `multipart/form-data` form, where `executable` is the name of the field containing the
binary file.

Specifying `autodeploy` query parameter will trigger a deploy command right after a successful upload.
Also specifying `autostart` query parameter will trigger a start command as well (only in case deployment succeeded).

As it has already been mentioned, upload endpoint requires a valid JWT token, so please make sure you've already claimed
one before using this endpoint and - of course - specify it as a header parameter.

In case you are using your own solution to copy the binaries to the server, it is recommended to disable this endpoint 
(`domino.storage.enable-upload`).

**Possible response statuses**

| Status               | Description                                                   |
|----------------------|---------------------------------------------------------------|
| `201 Created`        | Successful upload                                             |
| `400 Bad request`    | Invalid upload request (missing or invalid parameters         |
| `406 Not acceptable` | Not allowed MIME type or non-registered app                   |
| `409 Conflicting`    | Already existing binary (same name, same version)             |
| `403 Forbidden`      | Authentication failure (missing, invalid or expired JWT token |

## Lifecycle management commands

```
PUT /lifecycle/{app}/deploy[/{version}]
```

Deploy endpoint can be used to prepare the selected version of an application for execution. E.g. for filesystem based 
application sources, it means that the executable is copied from the storage to the app's home directory, and it is also
renamed to its expected filename.

Version is optional here - in case it is not provided, the latest uploaded version will be selected and deployed. In this
case please check the response of the endpoint, as it contains the actually deployed version (along with some other
information, please see below).

```
PUT /lifecycle/{app}/start
PUT /lifecycle/{app}/restart
DELETE /lifecycle/{app}/stop
```

The endpoints above execute the corresponding lifecycle command on an already deployed application.

**Response structure**

Response of lifecycle commands always contain:
 * a custom message, usually also containing the elapsed time in milliseconds, that was required to execute the command;
 * also a deployment status value, which provides more accurate insight of what happened due to the command execution;
 * and deploy endpoint also returns the deployed version. 

As an example a response would look like this:

```
{
    "message": "Deployment has finished for version 1.2.0 in 150 ms",
    "status": "DEPLOYED",
    "version": "1.2.0"
}

// or...

{
    "message": "Processed in 3100 ms",
    "status": "HEALTH_CHECK_OK"
}
```

**Possible deployment status values and response status**

| Deployment status               | Description                                                                                 | Related commands       | Mapped HTTP status          |
|---------------------------------|---------------------------------------------------------------------------------------------|------------------------|-----------------------------|
| `DEPLOYED`                      | Executable is successfully deployed                                                         | upload, deploy         | `201 Created`               |
| `DEPLOY_FAILED_UNKNOWN`         | Failed to deploy executable - check logs for details                                        | upload, deploy         | `500 Internal Server Error` |
| `DEPLOY_FAILED_MISSING_VERSION` | Deployment failed due to missing requested version                                          | deploy                 | `404 Not found`             |
| `UNKNOWN_STARTED`               | Application is supposed to be running, but it is not verified with health-check             | upload, start, restart | `202 Accepted`              |
| `START_FAILURE`                 | Failed to start application - check logs for details                                        | upload, start          | `500 Internal Server Error` |
| `STOPPED`                       | Application is stopped (verified)                                                           | stop                   | `201 Created`               |
| `STOP_FAILURE`                  | Failed to stop application - check logs for details                                         | stop, restart          | `500 Internal Server Error` |
| `UNKNOWN_STOPPED`               | Application is stopped, but it is not verified (might still be running)                     | stop                   | `202 Accepted`              |
| `HEALTH_CHECK_OK`               | Application is started and verified by health-check                                         | upload, start, restart | `201 Created`               |
| `HEALTH_CHECK_FAILURE`          | Application is supposed to be running, but health-check is failing - check logs for details | upload, start, restart | `500 Internal Server Error` |
| `INVALID_REQUEST`               | Invalid upload request                                                                      | upload                 | `400 Bad request`           |

For any of the endpoints above it is also possible that `403 Forbidden` is returned in case your JWT token is missing, invalid or expired.

# Future improvement plans

TODO
