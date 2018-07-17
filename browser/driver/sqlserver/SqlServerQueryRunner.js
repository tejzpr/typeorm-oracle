var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { Table } from "../../schema-builder/table/Table";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { MssqlParameter } from "./MssqlParameter";
import { OrmUtils } from "../../util/OrmUtils";
import { QueryFailedError } from "../../error/QueryFailedError";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { TableCheck } from "../../schema-builder/table/TableCheck";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { PromiseUtils } from "../../index";
/**
 * Runs queries on a single SQL Server database connection.
 */
var SqlServerQueryRunner = /** @class */ (function (_super) {
    __extends(SqlServerQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SqlServerQueryRunner(driver, mode) {
        if (mode === void 0) { mode = "master"; }
        var _this = _super.call(this) || this;
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * Last executed query in a transaction.
         * This is needed because in transaction mode mssql cannot execute parallel queries,
         * that's why we store last executed query promise to wait it when we execute next query.
         *
         * @see https://github.com/patriksimek/node-mssql/issues/491
         */
        _this.queryResponsibilityChain = [];
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster(_this);
        _this.mode = mode;
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    SqlServerQueryRunner.prototype.connect = function () {
        return Promise.resolve();
    };
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    SqlServerQueryRunner.prototype.release = function () {
        this.isReleased = true;
        return Promise.resolve();
    };
    /**
     * Starts transaction.
     */
    SqlServerQueryRunner.prototype.startTransaction = function (isolationLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isReleased)
                    throw new QueryRunnerAlreadyReleasedError();
                if (this.isTransactionActive)
                    throw new TransactionAlreadyStartedError();
                return [2 /*return*/, new Promise(function (ok, fail) { return __awaiter(_this, void 0, void 0, function () {
                        var pool, transactionCallback;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    this.isTransactionActive = true;
                                    return [4 /*yield*/, (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection())];
                                case 1:
                                    pool = _a.sent();
                                    this.databaseConnection = pool.transaction();
                                    transactionCallback = function (err) {
                                        if (err) {
                                            _this.isTransactionActive = false;
                                            return fail(err);
                                        }
                                        ok();
                                        _this.connection.logger.logQuery("BEGIN TRANSACTION");
                                        if (isolationLevel) {
                                            _this.connection.logger.logQuery("SET TRANSACTION ISOLATION LEVEL " + isolationLevel);
                                        }
                                    };
                                    if (isolationLevel) {
                                        this.databaseConnection.begin(this.convertIsolationLevel(isolationLevel), transactionCallback);
                                    }
                                    else {
                                        this.databaseConnection.begin(transactionCallback);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    SqlServerQueryRunner.prototype.commitTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isReleased)
                    throw new QueryRunnerAlreadyReleasedError();
                if (!this.isTransactionActive)
                    throw new TransactionNotStartedError();
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.databaseConnection.commit(function (err) {
                            if (err)
                                return fail(err);
                            _this.isTransactionActive = false;
                            _this.databaseConnection = null;
                            ok();
                            _this.connection.logger.logQuery("COMMIT");
                        });
                    })];
            });
        });
    };
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    SqlServerQueryRunner.prototype.rollbackTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isReleased)
                    throw new QueryRunnerAlreadyReleasedError();
                if (!this.isTransactionActive)
                    throw new TransactionNotStartedError();
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.databaseConnection.rollback(function (err) {
                            if (err)
                                return fail(err);
                            _this.isTransactionActive = false;
                            _this.databaseConnection = null;
                            ok();
                            _this.connection.logger.logQuery("ROLLBACK");
                        });
                    })];
            });
        });
    };
    /**
     * Executes a given SQL query.
     */
    SqlServerQueryRunner.prototype.query = function (query, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var waitingOkay, waitingPromise, otherWaitingPromises, promise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        waitingPromise = new Promise(function (ok) { return waitingOkay = ok; });
                        if (!this.queryResponsibilityChain.length) return [3 /*break*/, 2];
                        otherWaitingPromises = this.queryResponsibilityChain.slice();
                        this.queryResponsibilityChain.push(waitingPromise);
                        return [4 /*yield*/, Promise.all(otherWaitingPromises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        promise = new Promise(function (ok, fail) { return __awaiter(_this, void 0, void 0, function () {
                            var pool, request_1, queryStartTime_1, err_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        this.driver.connection.logger.logQuery(query, parameters, this);
                                        return [4 /*yield*/, (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection())];
                                    case 1:
                                        pool = _a.sent();
                                        request_1 = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                                        if (parameters && parameters.length) {
                                            parameters.forEach(function (parameter, index) {
                                                if (parameter instanceof MssqlParameter) {
                                                    var mssqlParameter = _this.mssqlParameterToNativeParameter(parameter);
                                                    if (mssqlParameter) {
                                                        request_1.input(index, mssqlParameter, parameter.value);
                                                    }
                                                    else {
                                                        request_1.input(index, parameter.value);
                                                    }
                                                }
                                                else {
                                                    request_1.input(index, parameter);
                                                }
                                            });
                                        }
                                        queryStartTime_1 = +new Date();
                                        request_1.query(query, function (err, result) {
                                            // log slow queries if maxQueryExecution time is set
                                            var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                                            var queryEndTime = +new Date();
                                            var queryExecutionTime = queryEndTime - queryStartTime_1;
                                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                                _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
                                            var resolveChain = function () {
                                                if (promiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(promiseIndex, 1);
                                                if (waitingPromiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                                                waitingOkay();
                                            };
                                            var promiseIndex = _this.queryResponsibilityChain.indexOf(promise);
                                            var waitingPromiseIndex = _this.queryResponsibilityChain.indexOf(waitingPromise);
                                            if (err) {
                                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                                resolveChain();
                                                return fail(new QueryFailedError(query, parameters, err));
                                            }
                                            ok(result.recordset);
                                            resolveChain();
                                        });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        err_1 = _a.sent();
                                        fail(err_1);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        // with this condition, Promise.all causes unexpected behavior.
                        // if (this.isTransactionActive)
                        this.queryResponsibilityChain.push(promise);
                        return [2 /*return*/, promise];
                }
            });
        });
    };
    /**
     * Returns raw data stream.
     */
    SqlServerQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        return __awaiter(this, void 0, void 0, function () {
            var waitingOkay, waitingPromise, otherWaitingPromises, promise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        waitingPromise = new Promise(function (ok) { return waitingOkay = ok; });
                        if (!this.queryResponsibilityChain.length) return [3 /*break*/, 2];
                        otherWaitingPromises = this.queryResponsibilityChain.slice();
                        this.queryResponsibilityChain.push(waitingPromise);
                        return [4 /*yield*/, Promise.all(otherWaitingPromises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        promise = new Promise(function (ok, fail) { return __awaiter(_this, void 0, void 0, function () {
                            var pool, request;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        this.driver.connection.logger.logQuery(query, parameters, this);
                                        return [4 /*yield*/, (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection())];
                                    case 1:
                                        pool = _a.sent();
                                        request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                                        request.stream = true;
                                        if (parameters && parameters.length) {
                                            parameters.forEach(function (parameter, index) {
                                                if (parameter instanceof MssqlParameter) {
                                                    request.input(index, _this.mssqlParameterToNativeParameter(parameter), parameter.value);
                                                }
                                                else {
                                                    request.input(index, parameter);
                                                }
                                            });
                                        }
                                        request.query(query, function (err, result) {
                                            var resolveChain = function () {
                                                if (promiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(promiseIndex, 1);
                                                if (waitingPromiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                                                waitingOkay();
                                            };
                                            var promiseIndex = _this.queryResponsibilityChain.indexOf(promise);
                                            var waitingPromiseIndex = _this.queryResponsibilityChain.indexOf(waitingPromise);
                                            if (err) {
                                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                                resolveChain();
                                                return fail(err);
                                            }
                                            ok(result.recordset);
                                            resolveChain();
                                        });
                                        if (onEnd)
                                            request.on("done", onEnd);
                                        if (onError)
                                            request.on("error", onError);
                                        ok(request);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        if (this.isTransactionActive)
                            this.queryResponsibilityChain.push(promise);
                        return [2 /*return*/, promise];
                }
            });
        });
    };
    /**
     * Returns all available database names including system databases.
     */
    SqlServerQueryRunner.prototype.getDatabases = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("EXEC sp_databases")];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (result) { return result["DATABASE_NAME"]; })];
                }
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    SqlServerQueryRunner.prototype.getSchemas = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            var query, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = database ? "SELECT * FROM \"" + database + "\".\"sys\".\"schema\"" : "SELECT * FROM \"sys\".\"schemas\"";
                        return [4 /*yield*/, this.query(query)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (result) { return result["name"]; })];
                }
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    SqlServerQueryRunner.prototype.hasDatabase = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            var result, dbId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT DB_ID('" + database + "') as \"db_id\"")];
                    case 1:
                        result = _a.sent();
                        dbId = result[0]["db_id"];
                        return [2 /*return*/, !!dbId];
                }
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    SqlServerQueryRunner.prototype.hasSchema = function (schema) {
        return __awaiter(this, void 0, void 0, function () {
            var result, schemaId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT SCHEMA_ID('" + schema + "') as \"schema_id\"")];
                    case 1:
                        result = _a.sent();
                        schemaId = result[0]["schema_id"];
                        return [2 /*return*/, !!schemaId];
                }
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    SqlServerQueryRunner.prototype.hasTable = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedTableName, schema, sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedTableName = this.parseTableName(tableOrName);
                        schema = parsedTableName.schema === "SCHEMA_NAME()" ? parsedTableName.schema : "'" + parsedTableName.schema + "'";
                        sql = "SELECT * FROM \"" + parsedTableName.database + "\".\"INFORMATION_SCHEMA\".\"TABLES\" WHERE \"TABLE_NAME\" = '" + parsedTableName.tableName + "' AND \"TABLE_SCHEMA\" = " + schema;
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? true : false];
                }
            });
        });
    };
    /**
     * Checks if column exist in the table.
     */
    SqlServerQueryRunner.prototype.hasColumn = function (tableOrName, columnName) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedTableName, schema, sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedTableName = this.parseTableName(tableOrName);
                        schema = parsedTableName.schema === "SCHEMA_NAME()" ? parsedTableName.schema : "'" + parsedTableName.schema + "'";
                        sql = "SELECT * FROM \"" + parsedTableName.database + "\".\"INFORMATION_SCHEMA\".\"TABLES\" WHERE \"TABLE_NAME\" = '" + parsedTableName.tableName + "' AND \"COLUMN_NAME\" = '" + columnName + "' AND \"TABLE_SCHEMA\" = " + schema;
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? true : false];
                }
            });
        });
    };
    /**
     * Creates a new database.
     */
    SqlServerQueryRunner.prototype.createDatabase = function (database, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            var up, down;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        up = ifNotExist ? "IF DB_ID('" + database + "') IS NULL CREATE DATABASE \"" + database + "\"" : "CREATE DATABASE \"" + database + "\"";
                        down = "DROP DATABASE \"" + database + "\"";
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops database.
     */
    SqlServerQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return __awaiter(this, void 0, void 0, function () {
            var up, down;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        up = ifExist ? "IF DB_ID('" + database + "') IS NOT NULL DROP DATABASE \"" + database + "\"" : "DROP DATABASE \"" + database + "\"";
                        down = "CREATE DATABASE \"" + database + "\"";
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be created in specified database.
     */
    SqlServerQueryRunner.prototype.createSchema = function (schemaPath, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, upQuery, dbName, schema, currentDB, upQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!(schemaPath.indexOf(".") === -1)) return [3 /*break*/, 1];
                        upQuery = ifNotExist ? "IF SCHEMA_ID('" + schemaPath + "') IS NULL BEGIN EXEC ('CREATE SCHEMA \"" + schemaPath + "\"') END" : "CREATE SCHEMA \"" + schemaPath + "\"";
                        upQueries.push(upQuery);
                        downQueries.push("DROP SCHEMA \"" + schemaPath + "\"");
                        return [3 /*break*/, 3];
                    case 1:
                        dbName = schemaPath.split(".")[0];
                        schema = schemaPath.split(".")[1];
                        return [4 /*yield*/, this.getCurrentDatabase()];
                    case 2:
                        currentDB = _a.sent();
                        upQueries.push("USE \"" + dbName + "\"");
                        downQueries.push("USE \"" + currentDB + "\"");
                        upQuery = ifNotExist ? "IF SCHEMA_ID('" + schema + "') IS NULL BEGIN EXEC ('CREATE SCHEMA \"" + schema + "\"') END" : "CREATE SCHEMA \"" + schema + "\"";
                        upQueries.push(upQuery);
                        downQueries.push("DROP SCHEMA \"" + schema + "\"");
                        upQueries.push("USE \"" + currentDB + "\"");
                        downQueries.push("USE \"" + dbName + "\"");
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be dropped in specified database.
     */
    SqlServerQueryRunner.prototype.dropSchema = function (schemaPath, ifExist) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, upQuery, dbName, schema, currentDB, upQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!(schemaPath.indexOf(".") === -1)) return [3 /*break*/, 1];
                        upQuery = ifExist ? "IF SCHEMA_ID('" + schemaPath + "') IS NULL BEGIN EXEC ('DROP SCHEMA \"" + schemaPath + "\"') END" : "DROP SCHEMA \"" + schemaPath + "\"";
                        upQueries.push(upQuery);
                        downQueries.push("CREATE SCHEMA \"" + schemaPath + "\"");
                        return [3 /*break*/, 3];
                    case 1:
                        dbName = schemaPath.split(".")[0];
                        schema = schemaPath.split(".")[1];
                        return [4 /*yield*/, this.getCurrentDatabase()];
                    case 2:
                        currentDB = _a.sent();
                        upQueries.push("USE \"" + dbName + "\"");
                        downQueries.push("USE \"" + currentDB + "\"");
                        upQuery = ifExist ? "IF SCHEMA_ID('" + schema + "') IS NULL BEGIN EXEC ('DROP SCHEMA \"" + schema + "\"') END" : "DROP SCHEMA \"" + schema + "\"";
                        upQueries.push(upQuery);
                        downQueries.push("CREATE SCHEMA \"" + schema + "\"");
                        upQueries.push("USE \"" + currentDB + "\"");
                        downQueries.push("USE \"" + dbName + "\"");
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new table.
     */
    SqlServerQueryRunner.prototype.createTable = function (table, ifNotExist, createForeignKeys, createIndices) {
        if (ifNotExist === void 0) { ifNotExist = false; }
        if (createForeignKeys === void 0) { createForeignKeys = true; }
        if (createIndices === void 0) { createIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var isTableExist, upQueries, downQueries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ifNotExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(table)];
                    case 1:
                        isTableExist = _a.sent();
                        if (isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2:
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.createTableSql(table, createForeignKeys));
                        downQueries.push(this.dropTableSql(table));
                        // if createForeignKeys is true, we must drop created foreign keys in down query.
                        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
                        if (createForeignKeys)
                            table.foreignKeys.forEach(function (foreignKey) { return downQueries.push(_this.dropForeignKeySql(table, foreignKey)); });
                        if (createIndices) {
                            table.indices.forEach(function (index) {
                                // new index may be passed without name. In this case we generate index name manually.
                                if (!index.name)
                                    index.name = _this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                                upQueries.push(_this.createIndexSql(table, index));
                                downQueries.push(_this.dropIndexSql(table, index));
                            });
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the table.
     */
    SqlServerQueryRunner.prototype.dropTable = function (tableOrName, ifExist, dropForeignKeys, dropIndices) {
        if (dropForeignKeys === void 0) { dropForeignKeys = true; }
        if (dropIndices === void 0) { dropIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var isTableExist, createForeignKeys, table, _a, upQueries, downQueries;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!ifExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(tableOrName)];
                    case 1:
                        isTableExist = _b.sent();
                        if (!isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _b.label = 2;
                    case 2:
                        createForeignKeys = dropForeignKeys;
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 3];
                        _a = tableOrName;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        table = _a;
                        upQueries = [];
                        downQueries = [];
                        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
                        // to perform drop queries for foreign keys and indices.
                        if (dropIndices) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.dropIndexSql(table, index));
                                downQueries.push(_this.createIndexSql(table, index));
                            });
                        }
                        // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
                        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
                        if (dropForeignKeys)
                            table.foreignKeys.forEach(function (foreignKey) { return upQueries.push(_this.dropForeignKeySql(table, foreignKey)); });
                        upQueries.push(this.dropTableSql(table));
                        downQueries.push(this.createTableSql(table, createForeignKeys));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames a table.
     */
    SqlServerQueryRunner.prototype.renameTable = function (oldTableOrName, newTableName) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, oldTable, _a, newTable, dbName, schemaName, oldTableName, splittedName, currentDB, columnNames, oldPkName, newPkName;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!(oldTableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = oldTableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(oldTableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        oldTable = _a;
                        newTable = oldTable.clone();
                        dbName = undefined;
                        schemaName = undefined;
                        oldTableName = oldTable.name;
                        splittedName = oldTable.name.split(".");
                        if (splittedName.length === 3) {
                            dbName = splittedName[0];
                            oldTableName = splittedName[2];
                            if (splittedName[1] !== "")
                                schemaName = splittedName[1];
                        }
                        else if (splittedName.length === 2) {
                            schemaName = splittedName[0];
                            oldTableName = splittedName[1];
                        }
                        newTable.name = this.driver.buildTableName(newTableName, schemaName, dbName);
                        return [4 /*yield*/, this.getCurrentDatabase()];
                    case 4:
                        currentDB = _b.sent();
                        if (dbName && dbName !== currentDB) {
                            upQueries.push("USE \"" + dbName + "\"");
                            downQueries.push("USE \"" + currentDB + "\"");
                        }
                        // rename table
                        upQueries.push("EXEC sp_rename \"" + this.escapeTableName(oldTable, true) + "\", \"" + newTableName + "\"");
                        downQueries.push("EXEC sp_rename \"" + this.escapeTableName(newTable, true) + "\", \"" + oldTableName + "\"");
                        // rename primary key constraint
                        if (newTable.primaryColumns.length > 0) {
                            columnNames = newTable.primaryColumns.map(function (column) { return column.name; });
                            oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                            newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                            // rename primary constraint
                            upQueries.push("EXEC sp_rename \"" + this.escapeTableName(newTable, true) + "." + oldPkName + "\", \"" + newPkName + "\"");
                            downQueries.push("EXEC sp_rename \"" + this.escapeTableName(newTable, true) + "." + newPkName + "\", \"" + oldPkName + "\"");
                        }
                        // rename unique constraints
                        newTable.uniques.forEach(function (unique) {
                            // build new constraint name
                            var newUniqueName = _this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.escapeTableName(newTable, true) + "." + unique.name + "\", \"" + newUniqueName + "\"");
                            downQueries.push("EXEC sp_rename \"" + _this.escapeTableName(newTable, true) + "." + newUniqueName + "\", \"" + unique.name + "\"");
                            // replace constraint name
                            unique.name = newUniqueName;
                        });
                        // rename index constraints
                        newTable.indices.forEach(function (index) {
                            // build new constraint name
                            var newIndexName = _this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.escapeTableName(newTable, true) + "." + index.name + "\", \"" + newIndexName + "\", \"INDEX\"");
                            downQueries.push("EXEC sp_rename \"" + _this.escapeTableName(newTable, true) + "." + newIndexName + "\", \"" + index.name + "\", \"INDEX\"");
                            // replace constraint name
                            index.name = newIndexName;
                        });
                        // rename foreign key constraints
                        newTable.foreignKeys.forEach(function (foreignKey) {
                            // build new constraint name
                            var newForeignKeyName = _this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.buildForeignKeyName(foreignKey.name, schemaName, dbName) + "\", \"" + newForeignKeyName + "\"");
                            downQueries.push("EXEC sp_rename \"" + _this.buildForeignKeyName(newForeignKeyName, schemaName, dbName) + "\", \"" + foreignKey.name + "\"");
                            // replace constraint name
                            foreignKey.name = newForeignKeyName;
                        });
                        // change currently used database back to default db.
                        if (dbName && dbName !== currentDB) {
                            upQueries.push("USE \"" + currentDB + "\"");
                            downQueries.push("USE \"" + dbName + "\"");
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 5:
                        _b.sent();
                        // rename old table and replace it in cached tabled;
                        oldTable.name = newTable.name;
                        this.replaceCachedTable(oldTable, newTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new column from the column in the table.
     */
    SqlServerQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, primaryColumns, pkName_1, columnNames_1, pkName, columnNames, columnIndex, uniqueConstraint, defaultName;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD " + this.buildCreateColumnSql(table, column, false, false));
                        downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP COLUMN \"" + column.name + "\"");
                        // create or update primary key constraint
                        if (column.isPrimary) {
                            primaryColumns = clonedTable.primaryColumns;
                            // if table already have primary key, me must drop it and recreate again
                            if (primaryColumns.length > 0) {
                                pkName_1 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName_1 + "\"");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName_1 + "\" PRIMARY KEY (" + columnNames_1 + ")");
                            }
                            primaryColumns.push(column);
                            pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                            columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName + "\"");
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            upQueries.push(this.createIndexSql(table, columnIndex));
                            downQueries.push(this.dropIndexSql(table, columnIndex));
                        }
                        // create unique constraint
                        if (column.isUnique) {
                            uniqueConstraint = new TableUnique({
                                name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                                columnNames: [column.name]
                            });
                            clonedTable.uniques.push(uniqueConstraint);
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + column.name + "\")");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + uniqueConstraint.name + "\"");
                        }
                        // create default constraint
                        if (column.default !== null && column.default !== undefined) {
                            defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + defaultName + "\" DEFAULT " + column.default + " FOR \"" + column.name + "\"");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + defaultName + "\"");
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.addColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new columns from the column in the table.
     */
    SqlServerQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils.runInSequence(columns, function (column) { return _this.addColumn(tableOrName, column); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames column in the given table.
     */
    SqlServerQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, oldColumn, newColumn;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(function (c) { return c.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        newColumn = undefined;
                        if (newTableColumnOrName instanceof TableColumn) {
                            newColumn = newTableColumnOrName;
                        }
                        else {
                            newColumn = oldColumn.clone();
                            newColumn.name = newTableColumnOrName;
                        }
                        return [4 /*yield*/, this.changeColumn(table, oldColumn, newColumn)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    SqlServerQueryRunner.prototype.changeColumn = function (tableOrName, oldTableColumnOrName, newColumn) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, oldColumn, dbName_1, schemaName_1, splittedName, currentDB, primaryColumns, columnNames, oldPkName, newPkName, oldTableColumn, primaryColumns, pkName, columnNames, column, pkName, columnNames, primaryColumn, column, pkName, columnNames, uniqueConstraint, uniqueConstraint, defaultName, defaultName;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        oldColumn = oldTableColumnOrName instanceof TableColumn
                            ? oldTableColumnOrName
                            : table.columns.find(function (column) { return column.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        if (!((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || newColumn.type !== oldColumn.type || newColumn.length !== oldColumn.length)) return [3 /*break*/, 6];
                        // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
                        // Also, we recreate column if column type changed
                        return [4 /*yield*/, this.dropColumn(table, oldColumn)];
                    case 4:
                        // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
                        // Also, we recreate column if column type changed
                        _b.sent();
                        return [4 /*yield*/, this.addColumn(table, newColumn)];
                    case 5:
                        _b.sent();
                        // update cloned table
                        clonedTable = table.clone();
                        return [3 /*break*/, 10];
                    case 6:
                        if (!(newColumn.name !== oldColumn.name)) return [3 /*break*/, 8];
                        dbName_1 = undefined;
                        schemaName_1 = undefined;
                        splittedName = table.name.split(".");
                        if (splittedName.length === 3) {
                            dbName_1 = splittedName[0];
                            if (splittedName[1] !== "")
                                schemaName_1 = splittedName[1];
                        }
                        else if (splittedName.length === 2) {
                            schemaName_1 = splittedName[0];
                        }
                        return [4 /*yield*/, this.getCurrentDatabase()];
                    case 7:
                        currentDB = _b.sent();
                        if (dbName_1 && dbName_1 !== currentDB) {
                            upQueries.push("USE \"" + dbName_1 + "\"");
                            downQueries.push("USE \"" + currentDB + "\"");
                        }
                        // rename the column
                        upQueries.push("EXEC sp_rename \"" + this.escapeTableName(table, true) + "." + oldColumn.name + "\", \"" + newColumn.name + "\"");
                        downQueries.push("EXEC sp_rename \"" + this.escapeTableName(table, true) + "." + newColumn.name + "\", \"" + oldColumn.name + "\"");
                        if (oldColumn.isPrimary === true) {
                            primaryColumns = clonedTable.primaryColumns;
                            columnNames = primaryColumns.map(function (column) { return column.name; });
                            oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                            // replace old column name with new column name
                            columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                            columnNames.push(newColumn.name);
                            newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                            // rename primary constraint
                            upQueries.push("EXEC sp_rename \"" + this.escapeTableName(clonedTable, true) + "." + oldPkName + "\", \"" + newPkName + "\"");
                            downQueries.push("EXEC sp_rename \"" + this.escapeTableName(clonedTable, true) + "." + newPkName + "\", \"" + oldPkName + "\"");
                        }
                        // rename index constraints
                        clonedTable.findColumnIndices(oldColumn).forEach(function (index) {
                            // build new constraint name
                            index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                            index.columnNames.push(newColumn.name);
                            var newIndexName = _this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + index.name + "\", \"" + newIndexName + "\", \"INDEX\"");
                            downQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + newIndexName + "\", \"" + index.name + "\", \"INDEX\"");
                            // replace constraint name
                            index.name = newIndexName;
                        });
                        // rename foreign key constraints
                        clonedTable.findColumnForeignKeys(oldColumn).forEach(function (foreignKey) {
                            // build new constraint name
                            foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                            foreignKey.columnNames.push(newColumn.name);
                            var newForeignKeyName = _this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.buildForeignKeyName(foreignKey.name, schemaName_1, dbName_1) + "\", \"" + newForeignKeyName + "\"");
                            downQueries.push("EXEC sp_rename \"" + _this.buildForeignKeyName(newForeignKeyName, schemaName_1, dbName_1) + "\", \"" + foreignKey.name + "\"");
                            // replace constraint name
                            foreignKey.name = newForeignKeyName;
                        });
                        // rename check constraints
                        clonedTable.findColumnChecks(oldColumn).forEach(function (check) {
                            // build new constraint name
                            check.columnNames.splice(check.columnNames.indexOf(oldColumn.name), 1);
                            check.columnNames.push(newColumn.name);
                            var newCheckName = _this.connection.namingStrategy.checkConstraintName(clonedTable, check.expression);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + check.name + "\", \"" + newCheckName + "\"");
                            downQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + newCheckName + "\", \"" + check.name + "\"");
                            // replace constraint name
                            check.name = newCheckName;
                        });
                        // rename unique constraints
                        clonedTable.findColumnUniques(oldColumn).forEach(function (unique) {
                            // build new constraint name
                            unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                            unique.columnNames.push(newColumn.name);
                            var newUniqueName = _this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                            // build queries
                            upQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + unique.name + "\", \"" + newUniqueName + "\"");
                            downQueries.push("EXEC sp_rename \"" + _this.escapeTableName(clonedTable, true) + "." + newUniqueName + "\", \"" + unique.name + "\"");
                            // replace constraint name
                            unique.name = newUniqueName;
                        });
                        // change currently used database back to default db.
                        if (dbName_1 && dbName_1 !== currentDB) {
                            upQueries.push("USE \"" + currentDB + "\"");
                            downQueries.push("USE \"" + dbName_1 + "\"");
                        }
                        oldTableColumn = clonedTable.columns.find(function (column) { return column.name === oldColumn.name; });
                        clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                        oldColumn.name = newColumn.name;
                        _b.label = 8;
                    case 8:
                        if (this.isColumnChanged(oldColumn, newColumn)) {
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ALTER COLUMN " + this.buildCreateColumnSql(table, newColumn, true, false));
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ALTER COLUMN " + this.buildCreateColumnSql(table, oldColumn, true, false));
                        }
                        if (newColumn.isPrimary !== oldColumn.isPrimary) {
                            primaryColumns = clonedTable.primaryColumns;
                            // if primary column state changed, we must always drop existed constraint.
                            if (primaryColumns.length > 0) {
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName + "\"");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")");
                            }
                            if (newColumn.isPrimary === true) {
                                primaryColumns.push(newColumn);
                                column = clonedTable.columns.find(function (column) { return column.name === newColumn.name; });
                                column.isPrimary = true;
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName + "\"");
                            }
                            else {
                                primaryColumn = primaryColumns.find(function (c) { return c.name === newColumn.name; });
                                primaryColumns.splice(primaryColumns.indexOf(primaryColumn), 1);
                                column = clonedTable.columns.find(function (column) { return column.name === newColumn.name; });
                                column.isPrimary = false;
                                // if we have another primary keys, we must recreate constraint.
                                if (primaryColumns.length > 0) {
                                    pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                    columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                    upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")");
                                    downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName + "\"");
                                }
                            }
                        }
                        if (newColumn.isUnique !== oldColumn.isUnique) {
                            if (newColumn.isUnique === true) {
                                uniqueConstraint = new TableUnique({
                                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                                    columnNames: [newColumn.name]
                                });
                                clonedTable.uniques.push(uniqueConstraint);
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + newColumn.name + "\")");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + uniqueConstraint.name + "\"");
                            }
                            else {
                                uniqueConstraint = clonedTable.uniques.find(function (unique) {
                                    return unique.columnNames.length === 1 && !!unique.columnNames.find(function (columnName) { return columnName === newColumn.name; });
                                });
                                clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint), 1);
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + uniqueConstraint.name + "\"");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + newColumn.name + "\")");
                            }
                        }
                        if (newColumn.default !== oldColumn.default) {
                            if (newColumn.default !== null && newColumn.default !== undefined) {
                                defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, newColumn.name);
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + defaultName + "\" DEFAULT " + newColumn.default + " FOR \"" + newColumn.name + "\"");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + defaultName + "\"");
                            }
                            else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                                defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, oldColumn.name);
                                upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + defaultName + "\"");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + defaultName + "\" DEFAULT " + oldColumn.default + " FOR \"" + oldColumn.name + "\"");
                            }
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 9:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        _b.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    SqlServerQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils.runInSequence(changedColumns, function (changedColumn) { return _this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops column in the table.
     */
    SqlServerQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, column, clonedTable, upQueries, downQueries, pkName, columnNames, tableColumn, pkName_2, columnNames_2, columnIndex, columnCheck, columnUnique, defaultName;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
                        if (!column)
                            throw new Error("Column \"" + columnOrName + "\" was not found in table \"" + table.name + "\"");
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        // drop primary key constraint
                        if (column.isPrimary) {
                            pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                            columnNames = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                            upQueries.push("ALTER TABLE " + this.escapeTableName(clonedTable) + " DROP CONSTRAINT \"" + pkName + "\"");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(clonedTable) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")");
                            tableColumn = clonedTable.findColumnByName(column.name);
                            tableColumn.isPrimary = false;
                            // if primary key have multiple columns, we must recreate it without dropped column
                            if (clonedTable.primaryColumns.length > 0) {
                                pkName_2 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                                columnNames_2 = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                                upQueries.push("ALTER TABLE " + this.escapeTableName(clonedTable) + " ADD CONSTRAINT \"" + pkName_2 + "\" PRIMARY KEY (" + columnNames_2 + ")");
                                downQueries.push("ALTER TABLE " + this.escapeTableName(clonedTable) + " DROP CONSTRAINT \"" + pkName_2 + "\"");
                            }
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                            upQueries.push(this.dropIndexSql(table, columnIndex));
                            downQueries.push(this.createIndexSql(table, columnIndex));
                        }
                        columnCheck = clonedTable.checks.find(function (check) { return !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name; });
                        if (columnCheck) {
                            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                            upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                            downQueries.push(this.createCheckConstraintSql(table, columnCheck));
                        }
                        columnUnique = clonedTable.uniques.find(function (unique) { return unique.columnNames.length === 1 && unique.columnNames[0] === column.name; });
                        if (columnUnique) {
                            clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
                            upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
                            downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
                        }
                        // drop default constraint
                        if (column.default !== null && column.default !== undefined) {
                            defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + defaultName + "\"");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + defaultName + "\" DEFAULT " + column.default + " FOR \"" + column.name + "\"");
                        }
                        upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP COLUMN \"" + column.name + "\"");
                        downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD " + this.buildCreateColumnSql(table, column, false, false));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.removeColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the columns in the table.
     */
    SqlServerQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils.runInSequence(columns, function (column) { return _this.dropColumn(tableOrName, column); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new primary key.
     */
    SqlServerQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        up = this.createPrimaryKeySql(table, columnNames);
                        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
                        clonedTable.columns.forEach(function (column) {
                            if (columnNames.find(function (columnName) { return columnName === column.name; }))
                                column.isPrimary = true;
                        });
                        down = this.dropPrimaryKeySql(clonedTable);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    SqlServerQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, columnNames, upQueries, downQueries, primaryColumns, pkName_3, columnNamesString_1, pkName, columnNamesString;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        columnNames = columns.map(function (column) { return column.name; });
                        upQueries = [];
                        downQueries = [];
                        primaryColumns = clonedTable.primaryColumns;
                        if (primaryColumns.length > 0) {
                            pkName_3 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                            columnNamesString_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName_3 + "\"");
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName_3 + "\" PRIMARY KEY (" + columnNamesString_1 + ")");
                        }
                        // update columns in table.
                        clonedTable.columns
                            .filter(function (column) { return columnNames.indexOf(column.name) !== -1; })
                            .forEach(function (column) { return column.isPrimary = true; });
                        pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
                        columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                        upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNamesString + ")");
                        downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + pkName + "\"");
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a primary key.
     */
    SqlServerQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        up = this.dropPrimaryKeySql(table);
                        down = this.createPrimaryKeySql(table, table.primaryColumns.map(function (column) { return column.name; }));
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.primaryColumns.forEach(function (column) {
                            column.isPrimary = false;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraint.
     */
    SqlServerQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new unique constraint may be passed without name. In this case we generate unique name manually.
                        if (!uniqueConstraint.name)
                            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);
                        up = this.createUniqueConstraintSql(table, uniqueConstraint);
                        down = this.dropUniqueConstraintSql(table, uniqueConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addUniqueConstraint(uniqueConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    SqlServerQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = uniqueConstraints.map(function (uniqueConstraint) { return _this.createUniqueConstraint(tableOrName, uniqueConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops unique constraint.
     */
    SqlServerQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, uniqueConstraint, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(function (u) { return u.name === uniqueOrName; });
                        if (!uniqueConstraint)
                            throw new Error("Supplied unique constraint was not found in table " + table.name);
                        up = this.dropUniqueConstraintSql(table, uniqueConstraint);
                        down = this.createUniqueConstraintSql(table, uniqueConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeUniqueConstraint(uniqueConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an unique constraints.
     */
    SqlServerQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = uniqueConstraints.map(function (uniqueConstraint) { return _this.dropUniqueConstraint(tableOrName, uniqueConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new check constraint.
     */
    SqlServerQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new unique constraint may be passed without name. In this case we generate unique name manually.
                        if (!checkConstraint.name)
                            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression);
                        up = this.createCheckConstraintSql(table, checkConstraint);
                        down = this.dropCheckConstraintSql(table, checkConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addCheckConstraint(checkConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new check constraints.
     */
    SqlServerQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = checkConstraints.map(function (checkConstraint) { return _this.createCheckConstraint(tableOrName, checkConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraint.
     */
    SqlServerQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, checkConstraint, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(function (c) { return c.name === checkOrName; });
                        if (!checkConstraint)
                            throw new Error("Supplied check constraint was not found in table " + table.name);
                        up = this.dropCheckConstraintSql(table, checkConstraint);
                        down = this.createCheckConstraintSql(table, checkConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeCheckConstraint(checkConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraints.
     */
    SqlServerQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = checkConstraints.map(function (checkConstraint) { return _this.dropCheckConstraint(tableOrName, checkConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new foreign key.
     */
    SqlServerQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new FK may be passed without name. In this case we generate FK name manually.
                        if (!foreignKey.name)
                            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);
                        up = this.createForeignKeySql(table, foreignKey);
                        down = this.dropForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new foreign keys.
     */
    SqlServerQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = foreignKeys.map(function (foreignKey) { return _this.createForeignKey(tableOrName, foreignKey); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign key from the table.
     */
    SqlServerQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKeyOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, foreignKey, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(function (fk) { return fk.name === foreignKeyOrName; });
                        if (!foreignKey)
                            throw new Error("Supplied foreign key was not found in table " + table.name);
                        up = this.dropForeignKeySql(table, foreignKey);
                        down = this.createForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign keys from the table.
     */
    SqlServerQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = foreignKeys.map(function (foreignKey) { return _this.dropForeignKey(tableOrName, foreignKey); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new index.
     */
    SqlServerQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new index may be passed without name. In this case we generate index name manually.
                        if (!index.name)
                            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                        up = this.createIndexSql(table, index);
                        down = this.dropIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new indices
     */
    SqlServerQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.createIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an index.
     */
    SqlServerQueryRunner.prototype.dropIndex = function (tableOrName, indexOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, index, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(function (i) { return i.name === indexOrName; });
                        if (!index)
                            throw new Error("Supplied index was not found in table " + table.name);
                        up = this.dropIndexSql(table, index);
                        down = this.createIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an indices from the table.
     */
    SqlServerQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.dropIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    SqlServerQueryRunner.prototype.clearTable = function (tablePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("TRUNCATE TABLE " + this.escapeTableName(tablePath))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes all tables from the currently connected database.
     */
    SqlServerQueryRunner.prototype.clearDatabase = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            var isDatabaseExist, allTablesSql, allTablesResults, error_1, rollbackError_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!database) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasDatabase(database)];
                    case 1:
                        isDatabaseExist = _a.sent();
                        if (!isDatabaseExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.startTransaction()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 9, , 14]);
                        allTablesSql = database
                            ? "SELECT * FROM \"" + database + "\".\"INFORMATION_SCHEMA\".\"TABLES\" WHERE \"TABLE_TYPE\" = 'BASE TABLE'"
                            : "SELECT * FROM \"INFORMATION_SCHEMA\".\"TABLES\" WHERE \"TABLE_TYPE\" = 'BASE TABLE'";
                        return [4 /*yield*/, this.query(allTablesSql)];
                    case 5:
                        allTablesResults = _a.sent();
                        return [4 /*yield*/, Promise.all(allTablesResults.map(function (tablesResult) { return __awaiter(_this, void 0, void 0, function () {
                                var dropForeignKeySql, dropFkQueries;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            dropForeignKeySql = "SELECT 'ALTER TABLE \"" + tablesResult["TABLE_CATALOG"] + "\".\"' + OBJECT_SCHEMA_NAME(\"fk\".\"parent_object_id\", DB_ID('" + tablesResult["TABLE_CATALOG"] + "')) + '\".\"' + OBJECT_NAME(\"fk\".\"parent_object_id\", DB_ID('" + tablesResult["TABLE_CATALOG"] + "')) + '\" " +
                                                ("DROP CONSTRAINT \"' + \"fk\".\"name\" + '\"' as \"query\" FROM \"" + tablesResult["TABLE_CATALOG"] + "\".\"sys\".\"foreign_keys\" AS \"fk\" ") +
                                                ("WHERE \"fk\".\"referenced_object_id\" = OBJECT_ID('\"" + tablesResult["TABLE_CATALOG"] + "\".\"" + tablesResult["TABLE_SCHEMA"] + "\".\"" + tablesResult["TABLE_NAME"] + "\"')");
                                            return [4 /*yield*/, this.query(dropForeignKeySql)];
                                        case 1:
                                            dropFkQueries = _a.sent();
                                            return [2 /*return*/, Promise.all(dropFkQueries.map(function (result) { return result["query"]; }).map(function (dropQuery) { return _this.query(dropQuery); }))];
                                    }
                                });
                            }); }))];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, Promise.all(allTablesResults.map(function (tablesResult) {
                                var dropTableSql = "DROP TABLE \"" + tablesResult["TABLE_CATALOG"] + "\".\"" + tablesResult["TABLE_SCHEMA"] + "\".\"" + tablesResult["TABLE_NAME"] + "\"";
                                return _this.query(dropTableSql);
                            }))];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.commitTransaction()];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 9:
                        error_1 = _a.sent();
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.rollbackTransaction()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 13];
                    case 13: throw error_1;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Return current database.
     */
    SqlServerQueryRunner.prototype.getCurrentDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentDBQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT DB_NAME() AS \"db_name\"")];
                    case 1:
                        currentDBQuery = _a.sent();
                        return [2 /*return*/, currentDBQuery[0]["db_name"]];
                }
            });
        });
    };
    /**
     * Return current schema.
     */
    SqlServerQueryRunner.prototype.getCurrentSchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentSchemaQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT SCHEMA_NAME() AS \"schema_name\"")];
                    case 1:
                        currentSchemaQuery = _a.sent();
                        return [2 /*return*/, currentSchemaQuery[0]["schema_name"]];
                }
            });
        });
    };
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    SqlServerQueryRunner.prototype.loadTables = function (tableNames) {
        return __awaiter(this, void 0, void 0, function () {
            var schemaNames, currentSchema, currentDatabase, extractTableSchemaAndName, dbNames, schemaNamesString, tablesCondition, tablesSql, columnsSql, constraintsCondition, constraintsSql, foreignKeysSql, identityColumnsSql, dbCollationsSql, indicesSql, _a, dbTables, dbColumns, dbConstraints, dbForeignKeys, dbIdentityColumns, dbCollations, dbIndices;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // if no tables given then no need to proceed
                        if (!tableNames || !tableNames.length)
                            return [2 /*return*/, []];
                        schemaNames = [];
                        return [4 /*yield*/, this.getCurrentSchema()];
                    case 1:
                        currentSchema = _b.sent();
                        return [4 /*yield*/, this.getCurrentDatabase()];
                    case 2:
                        currentDatabase = _b.sent();
                        extractTableSchemaAndName = function (tableName) {
                            var _a = tableName.split("."), database = _a[0], schema = _a[1], name = _a[2];
                            // if name is empty, it means that tableName have only schema name and table name or only table name
                            if (!name) {
                                // if schema is empty, it means tableName have only name of a table. Otherwise it means that we have "schemaName"."tableName" string.
                                if (!schema) {
                                    name = database;
                                    schema = _this.driver.options.schema || currentSchema;
                                }
                                else {
                                    name = schema;
                                    schema = database;
                                }
                            }
                            else if (schema === "") {
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return [schema, name];
                        };
                        tableNames.filter(function (tablePath) { return tablePath.indexOf(".") !== -1; })
                            .forEach(function (tablePath) {
                            if (tablePath.split(".").length === 3) {
                                if (tablePath.split(".")[1] !== "")
                                    schemaNames.push(tablePath.split(".")[1]);
                            }
                            else {
                                schemaNames.push(tablePath.split(".")[0]);
                            }
                        });
                        schemaNames.push(this.driver.options.schema || currentSchema);
                        dbNames = tableNames
                            .filter(function (tablePath) { return tablePath.split(".").length === 3; })
                            .map(function (tablePath) { return tablePath.split(".")[0]; });
                        if (this.driver.database && !dbNames.find(function (dbName) { return dbName === _this.driver.database; }))
                            dbNames.push(this.driver.database);
                        schemaNamesString = schemaNames.map(function (name) { return "'" + name + "'"; }).join(", ");
                        tablesCondition = tableNames.map(function (tableName) {
                            var _a = extractTableSchemaAndName(tableName), schema = _a[0], name = _a[1];
                            return "(\"TABLE_SCHEMA\" = '" + schema + "' AND \"TABLE_NAME\" = '" + name + "')";
                        }).join(" OR ");
                        tablesSql = dbNames.map(function (dbName) {
                            return "SELECT * FROM \"" + dbName + "\".\"INFORMATION_SCHEMA\".\"TABLES\" WHERE " + tablesCondition;
                        }).join(" UNION ALL ");
                        columnsSql = dbNames.map(function (dbName) {
                            return "SELECT * FROM \"" + dbName + "\".\"INFORMATION_SCHEMA\".\"COLUMNS\" WHERE " + tablesCondition;
                        }).join(" UNION ALL ");
                        constraintsCondition = tableNames.map(function (tableName) {
                            var _a = extractTableSchemaAndName(tableName), schema = _a[0], name = _a[1];
                            return "(\"columnUsages\".\"TABLE_SCHEMA\" = '" + schema + "' AND \"columnUsages\".\"TABLE_NAME\" = '" + name + "' " +
                                ("AND \"tableConstraints\".\"TABLE_SCHEMA\" = '" + schema + "' AND \"tableConstraints\".\"TABLE_NAME\" = '" + name + "')");
                        }).join(" OR ");
                        constraintsSql = dbNames.map(function (dbName) {
                            return "SELECT \"columnUsages\".*, \"tableConstraints\".\"CONSTRAINT_TYPE\", \"chk\".\"definition\" " +
                                ("FROM \"" + dbName + "\".\"INFORMATION_SCHEMA\".\"CONSTRAINT_COLUMN_USAGE\" \"columnUsages\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"INFORMATION_SCHEMA\".\"TABLE_CONSTRAINTS\" \"tableConstraints\" ON \"tableConstraints\".\"CONSTRAINT_NAME\" = \"columnUsages\".\"CONSTRAINT_NAME\" ") +
                                ("LEFT JOIN \"" + dbName + "\".\"sys\".\"check_constraints\" \"chk\" ON \"chk\".\"name\" = \"columnUsages\".\"CONSTRAINT_NAME\" ") +
                                ("WHERE (" + constraintsCondition + ") AND \"tableConstraints\".\"CONSTRAINT_TYPE\" IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')");
                        }).join(" UNION ALL ");
                        foreignKeysSql = dbNames.map(function (dbName) {
                            return "SELECT \"fk\".\"name\" AS \"FK_NAME\", '" + dbName + "' AS \"TABLE_CATALOG\", \"s1\".\"name\" AS \"TABLE_SCHEMA\", \"t1\".\"name\" AS \"TABLE_NAME\", " +
                                "\"col1\".\"name\" AS \"COLUMN_NAME\", \"s2\".\"name\" AS \"REF_SCHEMA\", \"t2\".\"name\" AS \"REF_TABLE\", \"col2\".\"name\" AS \"REF_COLUMN\", " +
                                "\"fk\".\"delete_referential_action_desc\" AS \"ON_DELETE\", \"fk\".\"update_referential_action_desc\" AS \"ON_UPDATE\" " +
                                ("FROM \"" + dbName + "\".\"sys\".\"foreign_keys\" \"fk\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"foreign_key_columns\" \"fkc\" ON \"fkc\".\"constraint_object_id\" = \"fk\".\"object_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"tables\" \"t1\" ON \"t1\".\"object_id\" = \"fk\".\"parent_object_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"schemas\" \"s1\" ON \"s1\".\"schema_id\" = \"t1\".\"schema_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"tables\" \"t2\" ON \"t2\".\"object_id\" = \"fk\".\"referenced_object_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"schemas\" \"s2\" ON \"s2\".\"schema_id\" = \"t2\".\"schema_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"columns\" \"col1\" ON \"col1\".\"column_id\" = \"fkc\".\"parent_column_id\" AND \"col1\".\"object_id\" = \"fk\".\"parent_object_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"columns\" \"col2\" ON \"col2\".\"column_id\" = \"fkc\".\"referenced_column_id\" AND \"col2\".\"object_id\" = \"fk\".\"referenced_object_id\"");
                        }).join(" UNION ALL ");
                        identityColumnsSql = dbNames.map(function (dbName) {
                            return "SELECT \"TABLE_CATALOG\", \"TABLE_SCHEMA\", \"COLUMN_NAME\", \"TABLE_NAME\" " +
                                ("FROM \"" + dbName + "\".\"INFORMATION_SCHEMA\".\"COLUMNS\" ") +
                                ("WHERE COLUMNPROPERTY(object_id(\"TABLE_CATALOG\" + '.' + \"TABLE_SCHEMA\" + '.' + \"TABLE_NAME\"), \"COLUMN_NAME\", 'IsIdentity') = 1 AND \"TABLE_SCHEMA\" IN (" + schemaNamesString + ")");
                        }).join(" UNION ALL ");
                        dbCollationsSql = "SELECT \"NAME\", \"COLLATION_NAME\" FROM \"SYS\".\"DATABASES\"";
                        indicesSql = dbNames.map(function (dbName) {
                            return "SELECT '" + dbName + "' AS \"TABLE_CATALOG\", \"s\".\"name\" AS \"TABLE_SCHEMA\", \"t\".\"name\" AS \"TABLE_NAME\", " +
                                "\"ind\".\"name\" AS \"INDEX_NAME\", \"col\".\"name\" AS \"COLUMN_NAME\", \"ind\".\"is_unique\" AS \"IS_UNIQUE\", \"ind\".\"filter_definition\" as \"CONDITION\" " +
                                ("FROM \"" + dbName + "\".\"sys\".\"indexes\" \"ind\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"index_columns\" \"ic\" ON \"ic\".\"object_id\" = \"ind\".\"object_id\" AND \"ic\".\"index_id\" = \"ind\".\"index_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"columns\" \"col\" ON \"col\".\"object_id\" = \"ic\".\"object_id\" AND \"col\".\"column_id\" = \"ic\".\"column_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"tables\" \"t\" ON \"t\".\"object_id\" = \"ind\".\"object_id\" ") +
                                ("INNER JOIN \"" + dbName + "\".\"sys\".\"schemas\" \"s\" ON \"s\".\"schema_id\" = \"t\".\"schema_id\" ") +
                                "WHERE \"ind\".\"is_primary_key\" = 0 AND \"ind\".\"is_unique_constraint\" = 0 AND \"t\".\"is_ms_shipped\" = 0";
                        }).join(" UNION ALL ");
                        return [4 /*yield*/, Promise.all([
                                this.query(tablesSql),
                                this.query(columnsSql),
                                this.query(constraintsSql),
                                this.query(foreignKeysSql),
                                this.query(identityColumnsSql),
                                this.query(dbCollationsSql),
                                this.query(indicesSql),
                            ])];
                    case 3:
                        _a = _b.sent(), dbTables = _a[0], dbColumns = _a[1], dbConstraints = _a[2], dbForeignKeys = _a[3], dbIdentityColumns = _a[4], dbCollations = _a[5], dbIndices = _a[6];
                        // if tables were not found in the db, no need to proceed
                        if (!dbTables.length)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, Promise.all(dbTables.map(function (dbTable) { return __awaiter(_this, void 0, void 0, function () {
                                var table, db, schema, tableFullName, defaultCollation, tableUniqueConstraints, tableCheckConstraints, tableForeignKeyConstraints, tableIndexConstraints;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    table = new Table();
                                    db = dbTable["TABLE_CATALOG"] === currentDatabase ? undefined : dbTable["TABLE_CATALOG"];
                                    schema = dbTable["TABLE_SCHEMA"] === currentSchema && !this.driver.options.schema ? undefined : dbTable["TABLE_SCHEMA"];
                                    table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema, db);
                                    tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["TABLE_SCHEMA"], dbTable["TABLE_CATALOG"]);
                                    defaultCollation = dbCollations.find(function (dbCollation) { return dbCollation["NAME"] === dbTable["TABLE_CATALOG"]; });
                                    // create columns from the loaded columns
                                    table.columns = dbColumns
                                        .filter(function (dbColumn) { return _this.driver.buildTableName(dbColumn["TABLE_NAME"], dbColumn["TABLE_SCHEMA"], dbColumn["TABLE_CATALOG"]) === tableFullName; })
                                        .map(function (dbColumn) {
                                        var columnConstraints = dbConstraints.filter(function (dbConstraint) {
                                            return _this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                                                && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                                        });
                                        var uniqueConstraint = columnConstraints.find(function (constraint) { return constraint["CONSTRAINT_TYPE"] === "UNIQUE"; });
                                        var isConstraintComposite = uniqueConstraint
                                            ? !!dbConstraints.find(function (dbConstraint) { return dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE"
                                                && dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"]
                                                && dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]; })
                                            : false;
                                        var isPrimary = !!columnConstraints.find(function (constraint) { return constraint["CONSTRAINT_TYPE"] === "PRIMARY KEY"; });
                                        var isGenerated = !!dbIdentityColumns.find(function (column) {
                                            return _this.driver.buildTableName(column["TABLE_NAME"], column["TABLE_SCHEMA"], column["TABLE_CATALOG"]) === tableFullName
                                                && column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                                        });
                                        var tableColumn = new TableColumn();
                                        tableColumn.name = dbColumn["COLUMN_NAME"];
                                        tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                                        // check only columns that have length property
                                        if (_this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1 && dbColumn["CHARACTER_MAXIMUM_LENGTH"]) {
                                            var length_1 = dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString();
                                            if (length_1 === "-1") {
                                                tableColumn.length = "MAX";
                                            }
                                            else {
                                                tableColumn.length = !_this.isDefaultColumnLength(table, tableColumn, length_1) ? length_1 : "";
                                            }
                                        }
                                        if (tableColumn.type === "decimal" || tableColumn.type === "numeric") {
                                            if (dbColumn["NUMERIC_PRECISION"] !== null && !_this.isDefaultColumnPrecision(table, tableColumn, dbColumn["NUMERIC_PRECISION"]))
                                                tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                                            if (dbColumn["NUMERIC_SCALE"] !== null && !_this.isDefaultColumnScale(table, tableColumn, dbColumn["NUMERIC_SCALE"]))
                                                tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                                        }
                                        tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined
                                            ? _this.removeParenthesisFromDefault(dbColumn["COLUMN_DEFAULT"])
                                            : undefined;
                                        tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                                        tableColumn.isPrimary = isPrimary;
                                        tableColumn.isUnique = !!uniqueConstraint && !isConstraintComposite;
                                        tableColumn.isGenerated = isGenerated;
                                        if (isGenerated)
                                            tableColumn.generationStrategy = "increment";
                                        if (tableColumn.default === "newsequentialid()") {
                                            tableColumn.isGenerated = true;
                                            tableColumn.generationStrategy = "uuid";
                                            tableColumn.default = undefined;
                                        }
                                        // todo: unable to get default charset
                                        // tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                                        tableColumn.collation = dbColumn["COLLATION_NAME"] === defaultCollation["COLLATION_NAME"] ? undefined : dbColumn["COLLATION_NAME"];
                                        if (tableColumn.type === "datetime2" || tableColumn.type === "time" || tableColumn.type === "datetimeoffset") {
                                            tableColumn.precision = !_this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATETIME_PRECISION"]) ? dbColumn["DATETIME_PRECISION"] : undefined;
                                        }
                                        return tableColumn;
                                    });
                                    tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(function (dbConstraint) {
                                        return _this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                                            && dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
                                    }), function (dbConstraint) { return dbConstraint["CONSTRAINT_NAME"]; });
                                    table.uniques = tableUniqueConstraints.map(function (constraint) {
                                        var uniques = dbConstraints.filter(function (dbC) { return dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]; });
                                        return new TableUnique({
                                            name: constraint["CONSTRAINT_NAME"],
                                            columnNames: uniques.map(function (u) { return u["COLUMN_NAME"]; })
                                        });
                                    });
                                    tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(function (dbConstraint) {
                                        return _this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                                            && dbConstraint["CONSTRAINT_TYPE"] === "CHECK";
                                    }), function (dbConstraint) { return dbConstraint["CONSTRAINT_NAME"]; });
                                    table.checks = tableCheckConstraints.map(function (constraint) {
                                        var checks = dbConstraints.filter(function (dbC) { return dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]; });
                                        return new TableCheck({
                                            name: constraint["CONSTRAINT_NAME"],
                                            columnNames: checks.map(function (c) { return c["COLUMN_NAME"]; }),
                                            expression: constraint["definition"]
                                        });
                                    });
                                    tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(function (dbForeignKey) {
                                        return _this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["TABLE_SCHEMA"], dbForeignKey["TABLE_CATALOG"]) === tableFullName;
                                    }), function (dbForeignKey) { return dbForeignKey["FK_NAME"]; });
                                    table.foreignKeys = tableForeignKeyConstraints.map(function (dbForeignKey) {
                                        var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["FK_NAME"] === dbForeignKey["FK_NAME"]; });
                                        // if referenced table located in currently used db and schema, we don't need to concat db and schema names to table name.
                                        var db = dbForeignKey["TABLE_CATALOG"] === currentDatabase ? undefined : dbForeignKey["TABLE_CATALOG"];
                                        var schema = dbForeignKey["REF_SCHEMA"] === currentSchema ? undefined : dbForeignKey["REF_SCHEMA"];
                                        var referencedTableName = _this.driver.buildTableName(dbForeignKey["REF_TABLE"], schema, db);
                                        return new TableForeignKey({
                                            name: dbForeignKey["FK_NAME"],
                                            columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                            referencedTableName: referencedTableName,
                                            referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REF_COLUMN"]; }),
                                            onDelete: dbForeignKey["ON_DELETE"].replace("_", " "),
                                            onUpdate: dbForeignKey["ON_UPDATE"].replace("_", " ") // SqlServer returns NO_ACTION, instead of NO ACTION
                                        });
                                    });
                                    tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(function (dbIndex) {
                                        return _this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["TABLE_SCHEMA"], dbIndex["TABLE_CATALOG"]) === tableFullName;
                                    }), function (dbIndex) { return dbIndex["INDEX_NAME"]; });
                                    table.indices = tableIndexConstraints.map(function (constraint) {
                                        var indices = dbIndices.filter(function (index) { return index["INDEX_NAME"] === constraint["INDEX_NAME"]; });
                                        return new TableIndex({
                                            table: table,
                                            name: constraint["INDEX_NAME"],
                                            columnNames: indices.map(function (i) { return i["COLUMN_NAME"]; }),
                                            isUnique: constraint["IS_UNIQUE"],
                                            where: constraint["CONDITION"]
                                        });
                                    });
                                    return [2 /*return*/, table];
                                });
                            }); }))];
                    case 4: 
                    // create table schemas for loaded tables
                    return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Builds and returns SQL for create table.
     */
    SqlServerQueryRunner.prototype.createTableSql = function (table, createForeignKeys) {
        var _this = this;
        var columnDefinitions = table.columns.map(function (column) { return _this.buildCreateColumnSql(table, column, false, true); }).join(", ");
        var sql = "CREATE TABLE " + this.escapeTableName(table) + " (" + columnDefinitions;
        table.columns
            .filter(function (column) { return column.isUnique; })
            .forEach(function (column) {
            var isUniqueExist = table.uniques.some(function (unique) { return unique.columnNames.length === 1 && unique.columnNames[0] === column.name; });
            if (!isUniqueExist)
                table.uniques.push(new TableUnique({
                    name: _this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                }));
        });
        if (table.uniques.length > 0) {
            var uniquesSql = table.uniques.map(function (unique) {
                var uniqueName = unique.name ? unique.name : _this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                var columnNames = unique.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                return "CONSTRAINT \"" + uniqueName + "\" UNIQUE (" + columnNames + ")";
            }).join(", ");
            sql += ", " + uniquesSql;
        }
        if (table.checks.length > 0) {
            var checksSql = table.checks.map(function (check) {
                var checkName = check.name ? check.name : _this.connection.namingStrategy.checkConstraintName(table.name, check.expression);
                return "CONSTRAINT \"" + checkName + "\" CHECK (" + check.expression + ")";
            }).join(", ");
            sql += ", " + checksSql;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            var foreignKeysSql = table.foreignKeys.map(function (fk) {
                var columnNames = fk.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                if (!fk.name)
                    fk.name = _this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                var referencedColumnNames = fk.referencedColumnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                var constraint = "CONSTRAINT \"" + fk.name + "\" FOREIGN KEY (" + columnNames + ") REFERENCES " + _this.escapeTableName(fk.referencedTableName) + " (" + referencedColumnNames + ")";
                if (fk.onDelete)
                    constraint += " ON DELETE " + fk.onDelete;
                if (fk.onUpdate)
                    constraint += " ON UPDATE " + fk.onUpdate;
                return constraint;
            }).join(", ");
            sql += ", " + foreignKeysSql;
        }
        var primaryColumns = table.columns.filter(function (column) { return column.isPrimary; });
        if (primaryColumns.length > 0) {
            var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(function (column) { return column.name; }));
            var columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
            sql += ", CONSTRAINT \"" + primaryKeyName + "\" PRIMARY KEY (" + columnNames + ")";
        }
        sql += ")";
        return sql;
    };
    /**
     * Builds drop table sql.
     */
    SqlServerQueryRunner.prototype.dropTableSql = function (tableOrName, ifExist) {
        return ifExist ? "DROP TABLE IF EXISTS " + this.escapeTableName(tableOrName) : "DROP TABLE " + this.escapeTableName(tableOrName);
    };
    /**
     * Builds create index sql.
     */
    SqlServerQueryRunner.prototype.createIndexSql = function (table, index) {
        var columns = index.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return "CREATE " + (index.isUnique ? "UNIQUE " : "") + "INDEX \"" + index.name + "\" ON " + this.escapeTableName(table) + "(" + columns + ") " + (index.where ? "WHERE " + index.where : "");
    };
    /**
     * Builds drop index sql.
     */
    SqlServerQueryRunner.prototype.dropIndexSql = function (table, indexOrName) {
        var indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return "DROP INDEX \"" + indexName + "\" ON " + this.escapeTableName(table);
    };
    /**
     * Builds create primary key sql.
     */
    SqlServerQueryRunner.prototype.createPrimaryKeySql = function (table, columnNames) {
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        var columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return "ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + primaryKeyName + "\" PRIMARY KEY (" + columnNamesString + ")";
    };
    /**
     * Builds drop primary key sql.
     */
    SqlServerQueryRunner.prototype.dropPrimaryKeySql = function (table) {
        var columnNames = table.primaryColumns.map(function (column) { return column.name; });
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return "ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + primaryKeyName + "\"";
    };
    /**
     * Builds create unique constraint sql.
     */
    SqlServerQueryRunner.prototype.createUniqueConstraintSql = function (table, uniqueConstraint) {
        var columnNames = uniqueConstraint.columnNames.map(function (column) { return "\"" + column + "\""; }).join(", ");
        return "ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (" + columnNames + ")";
    };
    /**
     * Builds drop unique constraint sql.
     */
    SqlServerQueryRunner.prototype.dropUniqueConstraintSql = function (table, uniqueOrName) {
        var uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return "ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + uniqueName + "\"";
    };
    /**
     * Builds create check constraint sql.
     */
    SqlServerQueryRunner.prototype.createCheckConstraintSql = function (table, checkConstraint) {
        return "ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + checkConstraint.name + "\" CHECK (" + checkConstraint.expression + ")";
    };
    /**
     * Builds drop check constraint sql.
     */
    SqlServerQueryRunner.prototype.dropCheckConstraintSql = function (table, checkOrName) {
        var checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return "ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + checkName + "\"";
    };
    /**
     * Builds create foreign key sql.
     */
    SqlServerQueryRunner.prototype.createForeignKeySql = function (table, foreignKey) {
        var columnNames = foreignKey.columnNames.map(function (column) { return "\"" + column + "\""; }).join(", ");
        var referencedColumnNames = foreignKey.referencedColumnNames.map(function (column) { return "\"" + column + "\""; }).join(",");
        var sql = "ALTER TABLE " + this.escapeTableName(table) + " ADD CONSTRAINT \"" + foreignKey.name + "\" FOREIGN KEY (" + columnNames + ") " +
            ("REFERENCES " + this.escapeTableName(foreignKey.referencedTableName) + "(" + referencedColumnNames + ")");
        if (foreignKey.onDelete)
            sql += " ON DELETE " + foreignKey.onDelete;
        if (foreignKey.onUpdate)
            sql += " ON UPDATE " + foreignKey.onUpdate;
        return sql;
    };
    /**
     * Builds drop foreign key sql.
     */
    SqlServerQueryRunner.prototype.dropForeignKeySql = function (table, foreignKeyOrName) {
        var foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return "ALTER TABLE " + this.escapeTableName(table) + " DROP CONSTRAINT \"" + foreignKeyName + "\"";
    };
    /**
     * Escapes given table name.
     */
    SqlServerQueryRunner.prototype.escapeTableName = function (tableOrName, disableEscape) {
        var name = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        if (this.driver.options.schema) {
            if (name.indexOf(".") === -1) {
                name = this.driver.options.schema + "." + name;
            }
            else if (name.split(".").length === 3) {
                var splittedName = name.split(".");
                var dbName = splittedName[0];
                var tableName = splittedName[2];
                name = dbName + "." + this.driver.options.schema + "." + tableName;
            }
        }
        return name.split(".").map(function (i) {
            // this condition need because when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return disableEscape ? i : "\"" + i + "\"";
        }).join(".");
    };
    SqlServerQueryRunner.prototype.parseTableName = function (target) {
        var tableName = target instanceof Table ? target.name : target;
        if (tableName.split(".").length === 3) {
            return {
                database: tableName.split(".")[0],
                schema: tableName.split(".")[1] === "" ? "SCHEMA_NAME()" : tableName.split(".")[1],
                tableName: tableName.split(".")[2]
            };
        }
        else if (tableName.split(".").length === 2) {
            return {
                database: this.driver.database,
                schema: tableName.split(".")[0],
                tableName: tableName.split(".")[1]
            };
        }
        else {
            return {
                database: this.driver.database,
                schema: this.driver.options.schema ? this.driver.options.schema : "SCHEMA_NAME()",
                tableName: tableName
            };
        }
    };
    /**
     * Concat database name and schema name to the foreign key name.
     * Needs because FK name is relevant to the schema and database.
     */
    SqlServerQueryRunner.prototype.buildForeignKeyName = function (fkName, schemaName, dbName) {
        var joinedFkName = fkName;
        if (schemaName)
            joinedFkName = schemaName + "." + joinedFkName;
        if (dbName)
            joinedFkName = dbName + "." + joinedFkName;
        return joinedFkName;
    };
    /**
     * Removes parenthesis around default value.
     * Sql server returns default value with parenthesis around, e.g.
     *  ('My text') - for string
     *  ((1)) - for number
     *  (newsequentialId()) - for function
     */
    SqlServerQueryRunner.prototype.removeParenthesisFromDefault = function (defaultValue) {
        if (defaultValue.substr(0, 1) !== "(")
            return defaultValue;
        var normalizedDefault = defaultValue.substr(1, defaultValue.lastIndexOf(")") - 1);
        return this.removeParenthesisFromDefault(normalizedDefault);
    };
    /**
     * Builds a query for create column.
     */
    SqlServerQueryRunner.prototype.buildCreateColumnSql = function (table, column, skipIdentity, createDefault) {
        var c = "\"" + column.name + "\" " + this.connection.driver.createFullType(column);
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment" && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)";
        if (column.default !== undefined && column.default !== null && createDefault) {
            // we create named constraint to be able to delete this constraint when column been dropped
            var defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            c += " CONSTRAINT \"" + defaultName + "\" DEFAULT " + column.default;
        }
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default) {
            // we create named constraint to be able to delete this constraint when column been dropped
            var defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            c += " CONSTRAINT \"" + defaultName + "\" DEFAULT NEWSEQUENTIALID()";
        }
        return c;
    };
    /**
     * Converts MssqlParameter into real mssql parameter type.
     */
    SqlServerQueryRunner.prototype.mssqlParameterToNativeParameter = function (parameter) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        switch (this.driver.normalizeType({ type: parameter.type })) {
            case "bit":
                return this.driver.mssql.Bit;
            case "bigint":
                return this.driver.mssql.BigInt;
            case "decimal":
                return (_a = this.driver.mssql).Decimal.apply(_a, parameter.params);
            case "float":
                return this.driver.mssql.Float;
            case "int":
                return this.driver.mssql.Int;
            case "money":
                return this.driver.mssql.Money;
            case "numeric":
                return (_b = this.driver.mssql).Numeric.apply(_b, parameter.params);
            case "smallint":
                return this.driver.mssql.SmallInt;
            case "smallmoney":
                return this.driver.mssql.SmallMoney;
            case "real":
                return this.driver.mssql.Real;
            case "tinyint":
                return this.driver.mssql.TinyInt;
            case "char":
                return (_c = this.driver.mssql).Char.apply(_c, parameter.params);
            case "nchar":
                return (_d = this.driver.mssql).NChar.apply(_d, parameter.params);
            case "text":
                return this.driver.mssql.Text;
            case "ntext":
                return this.driver.mssql.Ntext;
            case "varchar":
                return (_e = this.driver.mssql).VarChar.apply(_e, parameter.params);
            case "nvarchar":
                return (_f = this.driver.mssql).NVarChar.apply(_f, parameter.params);
            case "xml":
                return this.driver.mssql.Xml;
            case "time":
                return (_g = this.driver.mssql).Time.apply(_g, parameter.params);
            case "date":
                return this.driver.mssql.Date;
            case "datetime":
                return this.driver.mssql.DateTime;
            case "datetime2":
                return (_h = this.driver.mssql).DateTime2.apply(_h, parameter.params);
            case "datetimeoffset":
                return (_j = this.driver.mssql).DateTimeOffset.apply(_j, parameter.params);
            case "smalldatetime":
                return this.driver.mssql.SmallDateTime;
            case "uniqueidentifier":
                return this.driver.mssql.UniqueIdentifier;
            case "variant":
                return this.driver.mssql.Variant;
            case "binary":
                return this.driver.mssql.Binary;
            case "varbinary":
                return (_k = this.driver.mssql).VarBinary.apply(_k, parameter.params);
            case "image":
                return this.driver.mssql.Image;
            case "udt":
                return this.driver.mssql.UDT;
            case "rowversion":
                return this.driver.mssql.RowVersion;
        }
    };
    /**
     * Converts string literal of isolation level to enum.
     * The underlying mssql driver requires an enum for the isolation level.
     */
    SqlServerQueryRunner.prototype.convertIsolationLevel = function (isolation) {
        var ISOLATION_LEVEL = this.driver.mssql.ISOLATION_LEVEL;
        switch (isolation) {
            case "READ UNCOMMITTED":
                return ISOLATION_LEVEL.READ_UNCOMMITTED;
            case "REPEATABLE READ":
                return ISOLATION_LEVEL.REPEATABLE_READ;
            case "SERIALIZABLE":
                return ISOLATION_LEVEL.SERIALIZABLE;
            case "READ COMMITTED":
            default:
                return ISOLATION_LEVEL.READ_COMMITTED;
        }
    };
    return SqlServerQueryRunner;
}(BaseQueryRunner));
export { SqlServerQueryRunner };

//# sourceMappingURL=SqlServerQueryRunner.js.map
