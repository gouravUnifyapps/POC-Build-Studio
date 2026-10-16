//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!! THIS FILE IS AUTO-GENERATED - DO NOT EDIT !!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// Source: src/api/async/api.ts
// Regenerate: npm run generate (from _packages/native-preview)
//
/// <reference path="../node/node.ts" preserve="true" />
import { CompletionItemKind } from "#enums/completionItemKind";
import { DiagnosticCategory } from "#enums/diagnosticCategory";
import { ElementFlags } from "#enums/elementFlags";
import { NodeBuilderFlags } from "#enums/nodeBuilderFlags";
import { ObjectFlags } from "#enums/objectFlags";
import { SignatureFlags } from "#enums/signatureFlags";
import { SignatureKind } from "#enums/signatureKind";
import { SymbolFlags } from "#enums/symbolFlags";
import { TypeFlags } from "#enums/typeFlags";
import { TypePredicateKind } from "#enums/typePredicateKind";
import { ModifierFlags, } from "../../ast/index.js";
import { encodeNode, uint8ArrayToBase64, } from "../node/encoder.js";
import { decodeNode, getNodeId, parseNodeHandle, readParseOptionsKey, readSourceFileHash, RemoteSourceFile, } from "../node/node.js";
import { ObjectRegistry, } from "../objectRegistry.js";
import { createGetCanonicalFileName, toPath, } from "../path.js";
import { resolveFileName } from "../proto.js";
import { SourceFileCache } from "../sourceFileCache.js";
import { Client, } from "./client.js";
export { CompletionItemKind, DiagnosticCategory, ElementFlags, ModifierFlags, NodeBuilderFlags, ObjectFlags, SignatureFlags, SignatureKind, SymbolFlags, TypeFlags, TypePredicateKind };
export { documentURIToFileName, fileNameToDocumentURI } from "../path.js";
export class API {
    client;
    sourceFileCache;
    toPath;
    initialized = false;
    activeSnapshots = new Set();
    latestSnapshot;
    internal;
    constructor(options) {
        this.client = new Client(options);
        this.sourceFileCache = new SourceFileCache();
        this.internal = new InternalAPI(this.client, () => this.ensureInitialized());
    }
    /**
     * Create an API instance from an existing LSP connection's API session.
     * Use this when connecting to an API pipe provided by an LSP server via custom/initializeAPISession.
     */
    static fromLSPConnection(options) {
        const api = new API(options);
        api.ensureInitialized();
        return api;
    }
    ensureInitialized() {
        if (!this.initialized) {
            const response = this.client.apiRequest("initialize", null);
            const getCanonicalFileName = createGetCanonicalFileName(response.useCaseSensitiveFileNames);
            const currentDirectory = response.currentDirectory;
            this.toPath = (fileName) => toPath(fileName, currentDirectory, getCanonicalFileName);
            this.initialized = true;
        }
    }
    parseConfigFile(file) {
        this.ensureInitialized();
        return this.client.apiRequest("parseConfigFile", { file });
    }
    updateSnapshot(params) {
        this.ensureInitialized();
        const requestParams = params ?? {};
        if (requestParams.openProject) {
            requestParams.openProject = resolveFileName(requestParams.openProject);
        }
        const data = this.client.apiRequest("updateSnapshot", requestParams);
        // Retain cached source files from previous snapshot for unchanged files
        if (this.latestSnapshot) {
            this.sourceFileCache.retainForSnapshot(data.snapshot, this.latestSnapshot.id, data.changes);
            if (this.latestSnapshot.isDisposed()) {
                this.sourceFileCache.releaseSnapshot(this.latestSnapshot.id);
            }
        }
        const snapshot = new Snapshot(data, this.client, this.sourceFileCache, this.toPath, () => {
            this.activeSnapshots.delete(snapshot);
            if (snapshot !== this.latestSnapshot) {
                this.sourceFileCache.releaseSnapshot(snapshot.id);
            }
        });
        this.latestSnapshot = snapshot;
        this.activeSnapshots.add(snapshot);
        return snapshot;
    }
    close() {
        // Dispose all active snapshots
        for (const snapshot of [...this.activeSnapshots]) {
            snapshot.dispose();
        }
        // Release the latest snapshot's cache refs if still held
        if (this.latestSnapshot) {
            this.sourceFileCache.releaseSnapshot(this.latestSnapshot.id);
            this.latestSnapshot = undefined;
        }
        this.client.close();
        this.sourceFileCache.clear();
    }
    clearSourceFileCache() {
        this.sourceFileCache.clear();
    }
}
export class InternalAPI {
    client;
    ensureInitialized;
    /** @internal */
    constructor(client, ensureInitialized) {
        this.client = client;
        this.ensureInitialized = ensureInitialized;
    }
    startCPUProfile(dir) {
        this.ensureInitialized();
        this.client.apiRequest("startCPUProfile", { dir });
    }
    stopCPUProfile() {
        this.ensureInitialized();
        const result = this.client.apiRequest("stopCPUProfile", null);
        return result.file;
    }
    saveHeapProfile(dir) {
        this.ensureInitialized();
        const result = this.client.apiRequest("saveHeapProfile", { dir });
        return result.file;
    }
}
export class Snapshot {
    id;
    projectMap;
    toPath;
    client;
    objectRegistry;
    disposed = false;
    onDispose;
    constructor(data, client, sourceFileCache, toPath, onDispose) {
        this.id = data.snapshot;
        this.client = client;
        this.toPath = toPath;
        this.onDispose = onDispose;
        this.objectRegistry = new SnapshotObjectRegistry({
            createSymbol: symbolData => new Symbol(symbolData, this.objectRegistry),
            createType: typeData => new TypeObject(typeData, this.objectRegistry),
            createSignature: sigData => new Signature(sigData, this.objectRegistry),
        }, client, this.id);
        // Create projects
        this.projectMap = new Map();
        for (const projData of data.projects) {
            const project = new Project(projData, this.id, client, this.objectRegistry, sourceFileCache, toPath);
            this.projectMap.set(toPath(projData.configFileName), project);
        }
    }
    getProjects() {
        this.ensureNotDisposed();
        return [...this.projectMap.values()];
    }
    getProject(configFileName) {
        this.ensureNotDisposed();
        return this.projectMap.get(this.toPath(configFileName));
    }
    getDefaultProjectForFile(file) {
        this.ensureNotDisposed();
        const data = this.client.apiRequest("getDefaultProjectForFile", {
            snapshot: this.id,
            file,
        });
        if (!data)
            return undefined;
        return this.projectMap.get(this.toPath(data.configFileName));
    }
    [globalThis.Symbol.dispose]() {
        this.dispose();
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.objectRegistry.clear();
        this.onDispose();
        this.client.apiRequest("release", { snapshot: this.id });
    }
    isDisposed() {
        return this.disposed;
    }
    ensureNotDisposed() {
        if (this.disposed) {
            throw new Error("Snapshot is disposed");
        }
    }
}
class SnapshotObjectRegistry extends ObjectRegistry {
    client;
    snapshotId;
    constructor(factories, client, snapshotId) {
        super(factories);
        this.client = client;
        this.snapshotId = snapshotId;
    }
    fetchType(source, method, handle) {
        if (!handle)
            return undefined;
        const cached = this.getType(handle);
        if (cached)
            return cached;
        const data = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            objectId: source.id,
        });
        if (!data)
            throw new Error(`${method} returned null type for ${source.constructor.name} ${source.id}`);
        return this.getOrCreateType(data);
    }
    fetchSymbol(source, method, handle) {
        if (!handle)
            return undefined;
        const cached = this.getSymbol(handle);
        if (cached)
            return cached;
        const data = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            objectId: source.id,
        });
        if (!data)
            throw new Error(`${method} returned null symbol for ${source.constructor.name} ${source.id}`);
        return this.getOrCreateSymbol(data);
    }
    fetchSignature(source, method, handle) {
        if (!handle)
            return undefined;
        const cached = this.getSignature(handle);
        if (cached)
            return cached;
        const data = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            objectId: source.id,
        });
        if (!data)
            throw new Error(`${method} returned null signature for ${source.constructor.name} ${source.id}`);
        return this.getOrCreateSignature(data);
    }
    fetchTypes(source, method, handles) {
        if (handles) {
            const result = new Array(handles.length);
            let allCached = true;
            for (let i = 0; i < handles.length; i++) {
                const cached = this.getType(handles[i]);
                if (!cached) {
                    allCached = false;
                    break;
                }
                result[i] = cached;
            }
            if (allCached)
                return result;
        }
        const typesData = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            objectId: source.id,
        });
        if (typesData == null)
            return [];
        else
            return typesData.map(data => this.getOrCreateType(data));
    }
    fetchSymbols(source, method, handles) {
        if (handles) {
            const result = new Array(handles.length);
            let allCached = true;
            for (let i = 0; i < handles.length; i++) {
                const cached = this.getSymbol(handles[i]);
                if (!cached) {
                    allCached = false;
                    break;
                }
                result[i] = cached;
            }
            if (allCached)
                return result;
        }
        const symbolData = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            objectId: source.id,
        });
        if (symbolData == null)
            return [];
        else
            return symbolData.map(data => this.getOrCreateSymbol(data));
    }
}
export class Project {
    id;
    configFileName;
    compilerOptions;
    rootFiles;
    program;
    checker;
    emitter;
    client;
    constructor(data, snapshotId, client, objectRegistry, sourceFileCache, toPath) {
        this.id = data.id;
        this.configFileName = data.configFileName;
        this.compilerOptions = data.compilerOptions;
        this.rootFiles = data.rootFiles;
        this.client = client;
        this.program = new Program(snapshotId, this.id, client, sourceFileCache, toPath);
        this.checker = new Checker(snapshotId, this.id, client, objectRegistry);
        this.emitter = new Emitter(client);
    }
}
export class Program {
    snapshotId;
    projectId;
    client;
    sourceFileCache;
    toPath;
    decoder = new TextDecoder();
    constructor(snapshotId, projectId, client, sourceFileCache, toPath) {
        this.snapshotId = snapshotId;
        this.projectId = projectId;
        this.client = client;
        this.sourceFileCache = sourceFileCache;
        this.toPath = toPath;
    }
    getSourceFile(file) {
        const fileName = resolveFileName(file);
        const path = this.toPath(fileName);
        // Check if we already have a retained cache entry for this (snapshot, project) pair
        const retained = this.sourceFileCache.getRetained(path, this.snapshotId, this.projectId);
        if (retained) {
            return retained;
        }
        // Fetch from server
        const binaryData = this.client.apiRequestBinary("getSourceFile", {
            snapshot: this.snapshotId,
            project: this.projectId,
            file,
        });
        if (!binaryData) {
            return undefined;
        }
        const view = new DataView(binaryData.buffer, binaryData.byteOffset, binaryData.byteLength);
        const contentHash = readSourceFileHash(view);
        const parseOptionsKey = readParseOptionsKey(view);
        // Create a new RemoteSourceFile and cache it (set returns existing if hash matches)
        const sourceFile = new RemoteSourceFile(binaryData, this.decoder);
        return this.sourceFileCache.set(path, sourceFile, parseOptionsKey, contentHash, this.snapshotId, this.projectId);
    }
    /**
     * Get syntactic (parse) diagnostics for a specific file or all files.
     * @param file - Optional file to get diagnostics for. If omitted, returns diagnostics for all files.
     */
    getSyntacticDiagnostics(file) {
        const data = this.client.apiRequest("getSyntacticDiagnostics", {
            snapshot: this.snapshotId,
            project: this.projectId,
            ...(file !== undefined ? { file } : {}),
        });
        return data ?? [];
    }
    /**
     * Get semantic (type-check) diagnostics for a specific file or all files.
     * @param file - Optional file to get diagnostics for. If omitted, returns diagnostics for all files.
     */
    getSemanticDiagnostics(file) {
        const data = this.client.apiRequest("getSemanticDiagnostics", {
            snapshot: this.snapshotId,
            project: this.projectId,
            ...(file !== undefined ? { file } : {}),
        });
        return data ?? [];
    }
    /**
     * Get suggestion diagnostics for a specific file or all files.
     * @param file - Optional file to get diagnostics for. If omitted, returns diagnostics for all files.
     */
    getSuggestionDiagnostics(file) {
        const data = this.client.apiRequest("getSuggestionDiagnostics", {
            snapshot: this.snapshotId,
            project: this.projectId,
            ...(file !== undefined ? { file } : {}),
        });
        return data ?? [];
    }
    /**
     * Get declaration emit diagnostics for a specific file or all files.
     * @param file - Optional file to get diagnostics for. If omitted, returns diagnostics for all files.
     */
    getDeclarationDiagnostics(file) {
        const data = this.client.apiRequest("getDeclarationDiagnostics", {
            snapshot: this.snapshotId,
            project: this.projectId,
            ...(file !== undefined ? { file } : {}),
        });
        return data ?? [];
    }
    /**
     * Get config file parsing diagnostics for the project.
     */
    getConfigFileParsingDiagnostics() {
        const data = this.client.apiRequest("getConfigFileParsingDiagnostics", {
            snapshot: this.snapshotId,
            project: this.projectId,
        });
        return data ?? [];
    }
}
export class Checker {
    snapshotId;
    projectId;
    client;
    objectRegistry;
    constructor(snapshotId, projectId, client, objectRegistry) {
        this.snapshotId = snapshotId;
        this.projectId = projectId;
        this.client = client;
        this.objectRegistry = objectRegistry;
    }
    getSymbolAtLocation(nodeOrNodes) {
        if (Array.isArray(nodeOrNodes)) {
            const data = this.client.apiRequest("getSymbolsAtLocations", {
                snapshot: this.snapshotId,
                project: this.projectId,
                locations: nodeOrNodes.map(node => getNodeId(node)),
            });
            return data.map(d => d ? this.objectRegistry.getOrCreateSymbol(d) : undefined);
        }
        const data = this.client.apiRequest("getSymbolAtLocation", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(nodeOrNodes),
        });
        return data ? this.objectRegistry.getOrCreateSymbol(data) : undefined;
    }
    getSymbolAtPosition(file, positionOrPositions) {
        if (typeof positionOrPositions === "number") {
            const data = this.client.apiRequest("getSymbolAtPosition", {
                snapshot: this.snapshotId,
                project: this.projectId,
                file,
                position: positionOrPositions,
            });
            return data ? this.objectRegistry.getOrCreateSymbol(data) : undefined;
        }
        const data = this.client.apiRequest("getSymbolsAtPositions", {
            snapshot: this.snapshotId,
            project: this.projectId,
            file,
            positions: positionOrPositions,
        });
        return data.map(d => d ? this.objectRegistry.getOrCreateSymbol(d) : undefined);
    }
    getTypeOfSymbol(symbolOrSymbols) {
        if (Array.isArray(symbolOrSymbols)) {
            const data = this.client.apiRequest("getTypesOfSymbols", {
                snapshot: this.snapshotId,
                project: this.projectId,
                symbols: symbolOrSymbols.map(s => s.id),
            });
            return data.map(d => d ? this.objectRegistry.getOrCreateType(d) : undefined);
        }
        const data = this.client.apiRequest("getTypeOfSymbol", {
            snapshot: this.snapshotId,
            project: this.projectId,
            symbol: symbolOrSymbols.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getDeclaredTypeOfSymbol(symbol) {
        const data = this.client.apiRequest("getDeclaredTypeOfSymbol", {
            snapshot: this.snapshotId,
            project: this.projectId,
            symbol: symbol.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getReferencesToSymbolInFile(file, symbol) {
        const data = this.client.apiRequest("getReferencesToSymbolInFile", {
            snapshot: this.snapshotId,
            project: this.projectId,
            file,
            symbol: symbol.id,
        });
        return (data ?? []).map(h => new NodeHandle(h));
    }
    getReferencedSymbolsForNode(node, position) {
        const data = this.client.apiRequest("getReferencedSymbolsForNode", {
            snapshot: this.snapshotId,
            project: this.projectId,
            node: getNodeId(node),
            position,
        });
        return (data ?? []).map(entry => ({
            definition: new NodeHandle(entry.definition),
            symbol: entry.symbol ? this.objectRegistry.getOrCreateSymbol(entry.symbol) : undefined,
            references: (entry.references ?? []).map(h => new NodeHandle(h)),
        }));
    }
    getSignatureUsage(signatureDecl) {
        const data = this.client.apiRequest("getSignatureUsages", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signatureDecl: getNodeId(signatureDecl),
        });
        return (data ?? []).map(entry => ({
            name: new NodeHandle(entry.name),
            call: entry.call ? new NodeHandle(entry.call) : undefined,
        }));
    }
    getCompletionsAtPosition(document, position, options) {
        const data = this.client.apiRequest("getCompletionsAtPosition", {
            snapshot: this.snapshotId,
            project: this.projectId,
            file: document,
            position,
            triggerCharacter: options?.triggerCharacter,
            includeSymbol: options?.includeSymbol,
        });
        if (!data)
            return undefined;
        return {
            isIncomplete: data.isIncomplete,
            entries: data.entries.map(e => ({
                ...e,
                symbol: e.symbol ? this.objectRegistry.getOrCreateSymbol(e.symbol) : undefined,
            })),
        };
    }
    getTypeAtLocation(nodeOrNodes) {
        if (Array.isArray(nodeOrNodes)) {
            const data = this.client.apiRequest("getTypeAtLocations", {
                snapshot: this.snapshotId,
                project: this.projectId,
                locations: nodeOrNodes.map(node => getNodeId(node)),
            });
            return data.map(d => d ? this.objectRegistry.getOrCreateType(d) : undefined);
        }
        const data = this.client.apiRequest("getTypeAtLocation", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(nodeOrNodes),
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getSignaturesOfType(type, kind) {
        const data = this.client.apiRequest("getSignaturesOfType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
            kind,
        });
        return data.map(d => this.objectRegistry.getOrCreateSignature(d));
    }
    getResolvedSignature(node) {
        const data = this.client.apiRequest("getResolvedSignature", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(node),
        });
        return data ? this.objectRegistry.getOrCreateSignature(data) : undefined;
    }
    getTypeAtPosition(file, positionOrPositions) {
        if (typeof positionOrPositions === "number") {
            const data = this.client.apiRequest("getTypeAtPosition", {
                snapshot: this.snapshotId,
                project: this.projectId,
                file,
                position: positionOrPositions,
            });
            return data ? this.objectRegistry.getOrCreateType(data) : undefined;
        }
        const data = this.client.apiRequest("getTypesAtPositions", {
            snapshot: this.snapshotId,
            project: this.projectId,
            file,
            positions: positionOrPositions,
        });
        return data.map(d => d ? this.objectRegistry.getOrCreateType(d) : undefined);
    }
    resolveName(name, meaning, location, excludeGlobals) {
        // Distinguish Node (has `kind`) from DocumentPosition (has `document` and `position`)
        const isNode = location && "kind" in location;
        const data = this.client.apiRequest("resolveName", {
            snapshot: this.snapshotId,
            project: this.projectId,
            name,
            meaning,
            location: isNode ? getNodeId(location) : undefined,
            file: !isNode && location ? location.document : undefined,
            position: !isNode && location ? location.position : undefined,
            excludeGlobals,
        });
        return data ? this.objectRegistry.getOrCreateSymbol(data) : undefined;
    }
    getResolvedSymbol(node) {
        const text = node.text;
        if (!text)
            return undefined;
        return this.resolveName(text, SymbolFlags.Value | SymbolFlags.ExportValue, node);
    }
    getContextualType(node) {
        const data = this.client.apiRequest("getContextualType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(node),
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getBaseTypeOfLiteralType(type) {
        const data = this.client.apiRequest("getBaseTypeOfLiteralType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getNonNullableType(type) {
        const data = this.client.apiRequest("getNonNullableType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getTypeFromTypeNode(node) {
        const data = this.client.apiRequest("getTypeFromTypeNode", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(node),
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getWidenedType(type) {
        const data = this.client.apiRequest("getWidenedType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getParameterType(signature, index) {
        const data = this.client.apiRequest("getParameterType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signature: signature.id,
            index,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    isArrayLikeType(type) {
        return this.client.apiRequest("isArrayLikeType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
    }
    isTypeAssignableTo(source, target) {
        return this.client.apiRequest("isTypeAssignableTo", {
            snapshot: this.snapshotId,
            project: this.projectId,
            source: source.id,
            target: target.id,
        });
    }
    getShorthandAssignmentValueSymbol(node) {
        const data = this.client.apiRequest("getShorthandAssignmentValueSymbol", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(node),
        });
        return data ? this.objectRegistry.getOrCreateSymbol(data) : undefined;
    }
    getTypeOfSymbolAtLocation(symbol, location) {
        const data = this.client.apiRequest("getTypeOfSymbolAtLocation", {
            snapshot: this.snapshotId,
            project: this.projectId,
            symbol: symbol.id,
            location: getNodeId(location),
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getIntrinsicType(method) {
        const data = this.client.apiRequest(method, {
            snapshot: this.snapshotId,
            project: this.projectId,
        });
        return this.objectRegistry.getOrCreateType(data);
    }
    getAnyType() {
        return this.getIntrinsicType("getAnyType");
    }
    getStringType() {
        return this.getIntrinsicType("getStringType");
    }
    getNumberType() {
        return this.getIntrinsicType("getNumberType");
    }
    getBooleanType() {
        return this.getIntrinsicType("getBooleanType");
    }
    getVoidType() {
        return this.getIntrinsicType("getVoidType");
    }
    getUndefinedType() {
        return this.getIntrinsicType("getUndefinedType");
    }
    getNullType() {
        return this.getIntrinsicType("getNullType");
    }
    getNeverType() {
        return this.getIntrinsicType("getNeverType");
    }
    getUnknownType() {
        return this.getIntrinsicType("getUnknownType");
    }
    getBigIntType() {
        return this.getIntrinsicType("getBigIntType");
    }
    getESSymbolType() {
        return this.getIntrinsicType("getESSymbolType");
    }
    typeToTypeNode(type, enclosingDeclaration, flags) {
        const binaryData = this.client.apiRequestBinary("typeToTypeNode", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
            location: enclosingDeclaration ? getNodeId(enclosingDeclaration) : undefined,
            flags,
        });
        if (!binaryData)
            return undefined;
        return decodeNode(binaryData);
    }
    signatureToSignatureDeclaration(signature, kind, enclosingDeclaration, flags) {
        const binaryData = this.client.apiRequestBinary("signatureToSignatureDeclaration", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signature: signature.id,
            kind,
            location: enclosingDeclaration ? getNodeId(enclosingDeclaration) : undefined,
            flags,
        });
        if (!binaryData)
            return undefined;
        return decodeNode(binaryData);
    }
    typeToString(type, enclosingDeclaration, flags) {
        return this.client.apiRequest("typeToString", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
            location: enclosingDeclaration ? getNodeId(enclosingDeclaration) : undefined,
            flags,
        });
    }
    isContextSensitive(node) {
        return this.client.apiRequest("isContextSensitive", {
            snapshot: this.snapshotId,
            project: this.projectId,
            location: getNodeId(node),
        });
    }
    getReturnTypeOfSignature(signature) {
        const data = this.client.apiRequest("getReturnTypeOfSignature", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signature: signature.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getRestTypeOfSignature(signature) {
        const data = this.client.apiRequest("getRestTypeOfSignature", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signature: signature.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getTypePredicateOfSignature(signature) {
        const data = this.client.apiRequest("getTypePredicateOfSignature", {
            snapshot: this.snapshotId,
            project: this.projectId,
            signature: signature.id,
        });
        if (!data)
            return undefined;
        return {
            kind: data.kind,
            parameterIndex: data.parameterIndex,
            parameterName: data.parameterName,
            type: data.type ? this.objectRegistry.getOrCreateType(data.type) : undefined,
        };
    }
    getBaseTypes(type) {
        const data = this.client.apiRequest("getBaseTypes", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? data.map(d => this.objectRegistry.getOrCreateType(d)) : [];
    }
    getPropertiesOfType(type) {
        const data = this.client.apiRequest("getPropertiesOfType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? data.map(d => this.objectRegistry.getOrCreateSymbol(d)) : [];
    }
    getIndexInfosOfType(type) {
        const data = this.client.apiRequest("getIndexInfosOfType", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        if (!data)
            return [];
        return data.map(d => ({
            keyType: this.objectRegistry.getOrCreateType(d.keyType),
            valueType: this.objectRegistry.getOrCreateType(d.valueType),
            isReadonly: d.isReadonly ?? false,
            declaration: d.declaration ? new NodeHandle(d.declaration) : undefined,
        }));
    }
    getConstraintOfTypeParameter(type) {
        const data = this.client.apiRequest("getConstraintOfTypeParameter", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? this.objectRegistry.getOrCreateType(data) : undefined;
    }
    getTypeArguments(type) {
        const data = this.client.apiRequest("getTypeArguments", {
            snapshot: this.snapshotId,
            project: this.projectId,
            type: type.id,
        });
        return data ? data.map(d => this.objectRegistry.getOrCreateType(d)) : [];
    }
}
export class Emitter {
    client;
    constructor(client) {
        this.client = client;
    }
    printNode(node, options = {}) {
        const encoded = encodeNode(node);
        const base64 = uint8ArrayToBase64(encoded);
        return this.client.apiRequest("printNode", {
            data: base64,
            ...options,
        });
    }
}
export class NodeHandle {
    index;
    kind;
    path;
    constructor(handle) {
        const parsed = parseNodeHandle(handle);
        this.index = parsed.index;
        this.kind = parsed.kind;
        this.path = parsed.path;
    }
    /**
     * Resolve this handle to the actual AST node by fetching the source file
     * from the given project and looking up the node by index.
     */
    resolve(project) {
        const sourceFile = project.program.getSourceFile(this.path);
        if (!sourceFile) {
            return undefined;
        }
        return sourceFile.getOrCreateNodeAtIndex(this.index);
    }
}
export class Symbol {
    objectRegistry;
    id;
    name;
    flags;
    checkFlags;
    declarations;
    valueDeclaration;
    parent;
    exportSymbol;
    constructor(data, objectRegistry) {
        this.objectRegistry = objectRegistry;
        this.id = data.id;
        this.name = data.name;
        this.flags = data.flags;
        this.checkFlags = data.checkFlags;
        this.declarations = (data.declarations ?? []).map(d => new NodeHandle(d));
        this.valueDeclaration = data.valueDeclaration ? new NodeHandle(data.valueDeclaration) : undefined;
        if (data.parent !== undefined)
            this.parent = data.parent;
        if (data.exportSymbol !== undefined)
            this.exportSymbol = data.exportSymbol;
    }
    getParent() {
        return this.objectRegistry.fetchSymbol(this, "getParentOfSymbol", this.parent);
    }
    getMembers() {
        return this.objectRegistry.fetchSymbols(this, "getMembersOfSymbol");
    }
    getExports() {
        return this.objectRegistry.fetchSymbols(this, "getExportsOfSymbol");
    }
    getExportSymbol() {
        if (!this.exportSymbol)
            return this;
        return this.objectRegistry.fetchSymbol(this, "getExportSymbolOfSymbol", this.exportSymbol);
    }
}
class TypeObject {
    objectRegistry;
    id;
    flags;
    objectFlags;
    symbol;
    value;
    intrinsicName;
    isThisType;
    freshType;
    regularType;
    target;
    typeParameters;
    outerTypeParameters;
    localTypeParameters;
    aliasTypeArguments;
    aliasSymbol;
    elementFlags;
    fixedLength;
    readonly;
    texts;
    objectType;
    indexType;
    checkType;
    extendsType;
    baseType;
    substConstraint;
    constructor(data, objectRegistry) {
        this.objectRegistry = objectRegistry;
        this.id = data.id;
        this.flags = data.flags;
        if (data.objectFlags !== undefined)
            this.objectFlags = data.objectFlags;
        if (data.symbol !== undefined)
            this.symbol = data.symbol;
        if (data.value !== undefined)
            this.value = data.value;
        if (data.intrinsicName !== undefined)
            this.intrinsicName = data.intrinsicName;
        if (data.isThisType !== undefined)
            this.isThisType = data.isThisType;
        if (data.freshType !== undefined)
            this.freshType = data.freshType;
        if (data.regularType !== undefined)
            this.regularType = data.regularType;
        if (data.target !== undefined)
            this.target = data.target;
        this.typeParameters = data.typeParameters ?? [];
        this.outerTypeParameters = data.outerTypeParameters ?? [];
        this.localTypeParameters = data.localTypeParameters ?? [];
        this.aliasTypeArguments = data.aliasTypeArguments ?? [];
        if (data.aliasSymbol !== undefined)
            this.aliasSymbol = data.aliasSymbol;
        if (data.elementFlags !== undefined)
            this.elementFlags = data.elementFlags;
        if (data.fixedLength !== undefined)
            this.fixedLength = data.fixedLength;
        if (data.readonly !== undefined)
            this.readonly = data.readonly;
        if (data.texts !== undefined)
            this.texts = data.texts;
        if (data.objectType !== undefined)
            this.objectType = data.objectType;
        if (data.indexType !== undefined)
            this.indexType = data.indexType;
        if (data.checkType !== undefined)
            this.checkType = data.checkType;
        if (data.extendsType !== undefined)
            this.extendsType = data.extendsType;
        if (data.baseType !== undefined)
            this.baseType = data.baseType;
        if (data.substConstraint !== undefined)
            this.substConstraint = data.substConstraint;
    }
    getSymbol() {
        return this.objectRegistry.fetchSymbol(this, "getSymbolOfType", this.symbol);
    }
    getAliasSymbol() {
        return this.objectRegistry.fetchSymbol(this, "getAliasSymbolOfType", this.aliasSymbol);
    }
    getTarget() {
        return this.objectRegistry.fetchType(this, "getTargetOfType", this.target);
    }
    getFreshType() {
        return this.objectRegistry.fetchType(this, "getFreshTypeOfType", this.freshType);
    }
    getRegularType() {
        return this.objectRegistry.fetchType(this, "getRegularTypeOfType", this.regularType);
    }
    getTypes() {
        return this.objectRegistry.fetchTypes(this, "getTypesOfType");
    }
    getTypeParameters() {
        return this.objectRegistry.fetchTypes(this, "getTypeParametersOfType", this.typeParameters);
    }
    getOuterTypeParameters() {
        return this.objectRegistry.fetchTypes(this, "getOuterTypeParametersOfType", this.outerTypeParameters);
    }
    getLocalTypeParameters() {
        return this.objectRegistry.fetchTypes(this, "getLocalTypeParametersOfType", this.localTypeParameters);
    }
    getAliasTypeArguments() {
        return this.objectRegistry.fetchTypes(this, "getAliasTypeArgumentsOfType", this.aliasTypeArguments);
    }
    getObjectType() {
        return this.objectRegistry.fetchType(this, "getObjectTypeOfType", this.objectType);
    }
    getIndexType() {
        return this.objectRegistry.fetchType(this, "getIndexTypeOfType", this.indexType);
    }
    getCheckType() {
        return this.objectRegistry.fetchType(this, "getCheckTypeOfType", this.checkType);
    }
    getExtendsType() {
        return this.objectRegistry.fetchType(this, "getExtendsTypeOfType", this.extendsType);
    }
    getBaseType() {
        return this.objectRegistry.fetchType(this, "getBaseTypeOfType", this.baseType);
    }
    getConstraint() {
        return this.objectRegistry.fetchType(this, "getConstraintOfType", this.substConstraint);
    }
}
export class Signature {
    flags;
    objectRegistry;
    id;
    declaration;
    typeParameters;
    parameters;
    thisParameter;
    target;
    constructor(data, objectRegistry) {
        this.id = data.id;
        this.flags = data.flags;
        this.objectRegistry = objectRegistry;
        this.declaration = data.declaration ? new NodeHandle(data.declaration) : undefined;
        this.typeParameters = data.typeParameters ?? [];
        this.parameters = data.parameters ?? [];
        this.thisParameter = data.thisParameter;
        this.target = data.target;
    }
    getTypeParameters() {
        return this.objectRegistry.fetchTypes(this, "getTypeParametersOfSignature", this.typeParameters);
    }
    getParameters() {
        return this.objectRegistry.fetchSymbols(this, "getParametersOfSignature", this.parameters);
    }
    getThisParameter() {
        return this.objectRegistry.fetchSymbol(this, "getThisParameterOfSignature", this.thisParameter);
    }
    getTarget() {
        return this.objectRegistry.fetchSignature(this, "getTargetOfSignature", this.target);
    }
    get hasRestParameter() {
        return (this.flags & SignatureFlags.HasRestParameter) !== 0;
    }
    get isConstruct() {
        return (this.flags & SignatureFlags.Construct) !== 0;
    }
    get isAbstract() {
        return (this.flags & SignatureFlags.Abstract) !== 0;
    }
}
//# sourceMappingURL=api.js.map