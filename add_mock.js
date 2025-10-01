
const fs = require("fs");
const path = require("path");

// This script prepends a small mock for next/server into the route.test.ts file
// if that file exists. It's a safe, minimal script intended to avoid parse
// errors when running linters in this repository.

const targetPath = path.join("apps", "web", "src", "app", "api", "econeura", "[...path]", "route.test.ts");

const fs = require("fs");
const path = require("path");

// This script prepends a small mock for next/server into the route.test.ts file
// if that file exists. It's a safe, minimal script intended to avoid parse
// errors when running linters in this repository.

const targetPath = path.join("apps", "web", "src", "app", "api", "econeura", "[...path]", "route.test.ts");

function safeRead(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch (e) {
		return "";
	}
}

function safeWrite(filePath, content) {
	try {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, content, "utf8");
		return true;
	} catch (e) {
		console.error("add_mock.js: write failed:", e && e.message ? e.message : e);
		return false;
	}
}

const fs = require("fs");
const path = require("path");

// This script prepends a small mock for next/server into the route.test.ts file
// if that file exists. It's a safe, minimal script intended to avoid parse
// errors when running linters in this repository.

const targetPath = path.join("apps", "web", "src", "app", "api", "econeura", "[...path]", "route.test.ts");

function safeRead(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch (err) {
		// return empty if file doesn't exist or can't be read
		return "";
	}
}

function safeWrite(filePath, content) {
	try {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, content, "utf8");
		return true;
	} catch (err) {
		console.error("add_mock.js: write failed:", err && err.message ? err.message : err);
		return false;
	}
}

const original = safeRead(targetPath);

const mockCode = `// Mock next/server module (injected by add_mock.js)
vi.mock("next/server", () => ({
	NextRequest: vi.fn((url, options) => ({
		url: typeof url === "string" ? url : (url && url.href) || "",
		method: options?.method || "GET",
		headers: new Map(Object.entries(options?.headers || {})),
		json: vi.fn().mockResolvedValue(options?.body || {}),
		text: vi.fn().mockResolvedValue(JSON.stringify(options?.body || {})),
		clone: vi.fn(),
		arrayBuffer: vi.fn(),
		blob: vi.fn(),
		formData: vi.fn(),
	})),
	NextResponse: {
		json: vi.fn((data, options) => ({
			status: options?.status || 200,
			json: vi.fn().mockResolvedValue(data),
			headers: new Map(Object.entries(options?.headers || {})),
			ok: (options?.status || 200) < 400,
			clone: vi.fn(),
			text: vi.fn().mockResolvedValue(JSON.stringify(data)),
			arrayBuffer: vi.fn(),
			blob: vi.fn(),
		})),
		redirect: vi.fn((url, status) => ({
			status: status || 302,
			headers: new Map([["Location", url]]),
			ok: false,
			clone: vi.fn(),
			text: vi.fn(),
			json: vi.fn(),
			arrayBuffer: vi.fn(),
			blob: vi.fn(),
		})),
		next: vi.fn(() => ({
			status: 200,
			headers: new Map(),
			ok: true,
			clone: vi.fn(),
			text: vi.fn(),
			json: vi.fn(),
			arrayBuffer: vi.fn(),
			blob: vi.fn(),
		})),
	},
}));

`;

if (original.includes("Mock next/server module (injected by add_mock.js)")) {
	console.log("add_mock.js: mock already present in target file, no changes made.");
} else {
	const success = safeWrite(targetPath, mockCode + original);
	if (success) console.log("add_mock.js: mock injected into", targetPath);
	else console.log("add_mock.js: could not inject mock; repository unchanged.");
}

