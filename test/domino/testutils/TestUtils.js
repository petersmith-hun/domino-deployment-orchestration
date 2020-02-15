export class ResponseStubTemplate {
	status(httpStatus) {
	}

	send(body) {
	}
}

export class ChildProcessTemplate {
	on(event, listener) {
	}
}

export async function wait(timeout) {
	return await new Promise(resolve => setTimeout(resolve, timeout));
}

export function normalizePath(path) {
	return path.toString().split("\\").join("/");
}