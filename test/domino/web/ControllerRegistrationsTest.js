import sinon from "sinon";
import {assert} from "chai";
import ExpressMulterFactory from "../../../src/domino/web/factory/ExpressMulterFactory";
import ConfigurationProvider from "../../../src/domino/core/config/ConfigurationProvider";
import ExpressMiddlewareProvider from "../../../src/domino/web/middleware/ExpressMiddlewareProvider";
import UploadController from "../../../src/domino/web/controller/UploadController";
import LifecycleController from "../../../src/domino/web/controller/LifecycleController";
import AuthenticationController from "../../../src/domino/web/controller/AuthenticationController";
import ControllerRegistrations from "../../../src/domino/web/ControllerRegistrations";
import {AuthorizationMode} from "../../../src/domino/core/domain/AuthorizationMode";
import {Scope} from "../../../src/domino/web/security/Scope";

const expressOAuth2 = require("express-oauth2-jwt-bearer");
const rTracer = require("cls-rtracer");

describe("Unit tests for ControllerRegistrations", () => {

	let requiredScopesMock = null;
	let expressMock = null;
	let multerMock = null;
	let rTracerMock = null;
	let multerFactoryMock = null;
	let configurationProviderMock = null;
	let expressMiddlewareProviderMock = null;
	let uploadControllerMock = null;
	let lifecycleControllerMock = null;
	let authControllerMock = null;
	let controllerRegistrations = null;

	before(() => {
		requiredScopesMock = sinon.stub(expressOAuth2, "requiredScopes");
		rTracerMock = sinon.stub(rTracer, "expressMiddleware")
	});

	beforeEach(() => {
		_prepareMocks();
	});

	afterEach(() => {
		sinon.reset();
	});

	describe("Test scenarios for #registerRoutes", () => {

		it("should register all middlewares and endpoints with enabled upload endpoint and OAuth", () => {

			// given
			_prepareMockBehavior(true, AuthorizationMode.OAUTH);
			_prepareMockedControllerRegistrations();

			// when
			controllerRegistrations.registerRoutes(expressMock);

			// then
			_assertMiddlewares(8, 3);
			_assertNumberOfControllers(8);
			_assertControllerRegistered(expressMock.get, "/lifecycle/:app/info", lifecycleControllerMock.getInfo, Scope.READ_INFO);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy", lifecycleControllerMock.deploy, Scope.WRITE_DEPLOY);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy/:version", lifecycleControllerMock.deploy, Scope.WRITE_DEPLOY);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/start", lifecycleControllerMock.start, Scope.WRITE_START);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/restart", lifecycleControllerMock.restart, Scope.WRITE_RESTART);
			_assertControllerRegistered(expressMock.delete, "/lifecycle/:app/stop", lifecycleControllerMock.stop, Scope.WRITE_DELETE);
			_assertControllerRegistered(expressMock.post, "/claim-token", authControllerMock.claimToken);
			_assertControllerRegistered(expressMock.post, "/upload/:app/:version", uploadControllerMock.uploadExecutable, Scope.WRITE_UPLOAD, true);
		});

		it("should register middlewares and endpoints with disabled upload endpoint and enabled OAuth", () => {

			// given
			_prepareMockBehavior(false, AuthorizationMode.OAUTH);
			_prepareMockedControllerRegistrations();

			// when
			controllerRegistrations.registerRoutes(expressMock);

			// then
			_assertMiddlewares(7, 2);
			_assertNumberOfControllers(7);
			_assertControllerRegistered(expressMock.get, "/lifecycle/:app/info", lifecycleControllerMock.getInfo, Scope.READ_INFO);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy", lifecycleControllerMock.deploy, Scope.WRITE_DEPLOY);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy/:version", lifecycleControllerMock.deploy, Scope.WRITE_DEPLOY);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/start", lifecycleControllerMock.start, Scope.WRITE_START);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/restart", lifecycleControllerMock.restart, Scope.WRITE_RESTART);
			_assertControllerRegistered(expressMock.delete, "/lifecycle/:app/stop", lifecycleControllerMock.stop, Scope.WRITE_DELETE);
			_assertControllerRegistered(expressMock.post, "/claim-token", authControllerMock.claimToken);
		});

		it("should register middlewares and endpoints with enabled upload endpoint and disabled OAuth", () => {

			// given
			_prepareMockBehavior(true, AuthorizationMode.DIRECT);
			_prepareMockedControllerRegistrations();

			// when
			controllerRegistrations.registerRoutes(expressMock);

			// then
			_assertMiddlewares(8, 3);
			_assertNumberOfControllers(8);
			_assertControllerRegistered(expressMock.get, "/lifecycle/:app/info", lifecycleControllerMock.getInfo, true);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy", lifecycleControllerMock.deploy, true);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/deploy/:version", lifecycleControllerMock.deploy, true);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/start", lifecycleControllerMock.start, true);
			_assertControllerRegistered(expressMock.put, "/lifecycle/:app/restart", lifecycleControllerMock.restart, true);
			_assertControllerRegistered(expressMock.delete, "/lifecycle/:app/stop", lifecycleControllerMock.stop, true);
			_assertControllerRegistered(expressMock.post, "/claim-token", authControllerMock.claimToken);
			_assertControllerRegistered(expressMock.post, "/upload/:app/:version", uploadControllerMock.uploadExecutable, true, true);
		});

		it("should register routes throw error on missing controller registration", () => {

			// given
			_prepareMockBehavior(true, AuthorizationMode.DIRECT);
			controllerRegistrations = new ControllerRegistrations(multerFactoryMock, configurationProviderMock, expressMiddlewareProviderMock,
				uploadControllerMock, lifecycleControllerMock);

			// when
			assert.throws(() => controllerRegistrations.registerRoutes(expressMock), Error, "Failed to register controller=auth - stopping");

			// then
			// exception expected
		});

		function _assertMiddlewares(expectedNumberOfMiddlewareCalls, expectedNumberOfDefaultErrorHandlerCalls) {

			assert.isTrue(expressMock.use.callCount === expectedNumberOfMiddlewareCalls);

			for (let index = 0; index < expressMock.use.callCount; index++) {
				const callArgs = expressMock.use.getCall(index).args;
				if (callArgs[0] instanceof Function) {
					callArgs[0]();
				}
			}

			assert.isTrue(rTracerMock.called);
			assert.isTrue(expressMiddlewareProviderMock.remoteAddressVerification.called);
			assert.isTrue(expressMiddlewareProviderMock.jwtVerification.called);
			assert.isTrue(expressMiddlewareProviderMock.oauthJWTVerification.called);
			assert.isTrue(expressMiddlewareProviderMock.callStartMarker.called);
			assert.isTrue(expressMiddlewareProviderMock.defaultErrorHandler.called);
			assert.isTrue(expressMiddlewareProviderMock.defaultErrorHandler.callCount === expectedNumberOfDefaultErrorHandlerCalls);
		}

		function _assertNumberOfControllers(expectedNumberOfRegisteredControllers) {

			const numberOfRegisteredControllers = expressMock.get.callCount
				+ expressMock.put.callCount
				+ expressMock.post.callCount
				+ expressMock.delete.callCount;

			assert.equal(numberOfRegisteredControllers, expectedNumberOfRegisteredControllers);
		}

		function _assertControllerRegistered(expectedExpressCall, controllerPath, controllerMock, scope, verifyMulter = false) {

			let callArgs = _extractCall(expectedExpressCall, controllerPath);
			assert.isNotNull(callArgs);

			if (scope === undefined) {
				_assertController(callArgs[1], controllerMock);
			} else {
				_assertScope(callArgs[1], scope);

				if (verifyMulter) {
					assert.isTrue(multerMock.single.calledWith("executable"));
					_assertController(callArgs[3], controllerMock);
				} else {
					_assertController(callArgs[2], controllerMock);
				}
			}
		}

		function _extractCall(expectedExpressCall, controllerPath) {

			for (let index = 0; index < expectedExpressCall.callCount; index++) {
				let currentCallArgs = expectedExpressCall.getCall(index).args;
				if (currentCallArgs[0] === controllerPath) {
					return  currentCallArgs;
				}
			}

			return null;
		}

		function _assertScope(callArgs, scope) {
			assert.equal(callArgs, scope);
		}

		function _assertController(callArgs, controllerMock) {
			callArgs();
			assert.isTrue(controllerMock.called);
			controllerMock.reset();
		}
	});

	function _prepareMocks() {

		expressMock = sinon.createStubInstance(ExpressStub);
		multerMock = sinon.createStubInstance(MulterStub);
		multerFactoryMock = sinon.createStubInstance(ExpressMulterFactory);
		configurationProviderMock = sinon.createStubInstance(ConfigurationProvider);
		expressMiddlewareProviderMock = sinon.createStubInstance(ExpressMiddlewareProvider);
		uploadControllerMock = sinon.createStubInstance(UploadController);
		lifecycleControllerMock = sinon.createStubInstance(LifecycleController);
		authControllerMock = sinon.createStubInstance(AuthenticationController);
	}

	function _prepareMockBehavior(uploadEnabled, authorizationMode) {

		requiredScopesMock.returnsArg(0);

		expressMock.use.returns(expressMock);
		expressMock.get.returns(expressMock);
		expressMock.post.returns(expressMock);
		expressMock.put.returns(expressMock);
		expressMock.delete.returns(expressMock);

		multerFactoryMock.createExpressMulter.returns(multerMock);

		expressMiddlewareProviderMock.asyncErrorHandler.returnsArg(0);

		configurationProviderMock.getStorageConfiguration.returns({"enable-upload": uploadEnabled});
		configurationProviderMock.getAuthorizationMode.returns(authorizationMode);

		uploadControllerMock.getControllerName.returns("upload");
		lifecycleControllerMock.getControllerName.returns("lifecycle");
		authControllerMock.getControllerName.returns("auth");
	}

	function _prepareMockedControllerRegistrations() {

		controllerRegistrations = new ControllerRegistrations(multerFactoryMock, configurationProviderMock, expressMiddlewareProviderMock,
			uploadControllerMock, lifecycleControllerMock, authControllerMock);
	}
});

class ExpressStub {

	use() {}
	get() {}
	post() {}
	put() {}
	delete() {}
}

class MulterStub {

	single() {}
}
