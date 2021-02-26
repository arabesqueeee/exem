/*eslint no-console: 0*/
"use strict";
const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
const hana = require('@sap/hana-client');
const exemObj = require('./service/zlms_app_exem');
//var hdbext = require('@sap/hdbext');


const JWTStrategy = require('@sap/xssec').JWTStrategy;
const app = express();

xsenv.loadEnv();
const services = xsenv.getServices({
	uaa: 'exem_uaa'
});

passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());

let hanaOptions = xsenv.getServices({
	hana: {
		plan: 'hdi-shared'
	}
});
var hanaOptionsReduced = {
	host: hanaOptions.hana.host,
	port: hanaOptions.hana.port,
	user: hanaOptions.hana.user,
	password: hanaOptions.hana.password,
	schema: hanaOptions.hana.schema
};
console.log(hanaOptionsReduced); // Lists all authentication data (just for debugging)


app.use(passport.authenticate('JWT', {
	session: false
}));

//hana DB
const conn = hana.createConnection();
var conn_params = {};
// read HDB_config.json 配置文件

conn_params.serverNode = hanaOptionsReduced.host + ":" + hanaOptionsReduced.port;
conn_params.uid = hanaOptionsReduced.user;
conn_params.pwd = hanaOptionsReduced.password;
conn_params.encrypt = "true";
conn_params.sslValidateCertificate = "false";

var result = {
	status: "success"
};

// eslint-disable-next-line no-unused-vars
app.get('/user', function (req, res, next) {

	var sqlString = 'select empId from "ZSCH_ODATA"."ZTAB_EC_USER" where email = \'' + req.user.id + '\' limit 1';

	conn.connect(conn_params, function (err) {
		if (err) {
			if (err.code === 10) {
				result.status = 'error';
				result.message = err.message;
				console.log('error log:', err);
			}
			res.status(500).send(result);
		} else {
      console.log(sqlString);
			var rows = conn.exec(sqlString, function (err, rows) {
        result.data = rows;

        console.log(rows);
        console.log(err);
				res.status(200).send(result);
				conn.disconnect();
			});
		}
	});
});

app.get('/programstatus_hdb.xsjs', function (req, res) {
	var sqlString = exemObj.queryProgram(req, res);
	console.log('Selecting Data' + sqlString);
	conn.connect(conn_params, function (err) {
		if (err) {
			if (err.code === 10) {
				result.status = 'error';
				result.message = err.message;
				console.log('error log:', err);
			}
			res.status(500).send(result);
		} else {

			var rows = conn.exec(sqlString, function (err, rows) {
				result.data = rows;
				res.status(200).send(result);
				conn.disconnect();
			});
		}
	});
});

app.post('/programstatus_hdb.xsjs', function (req, res) {

	var sqlString = exemObj.updateProgram(req, res);
	conn.connect(conn_params, function (err) {
		if (err) {
			if (err.code === 10) {
				result.status = 'error';
				result.message = err.message;
				console.log('error log:', err);
			}
			res.status(500).send(result);
		} else {


		}
	});

});

app.get('/userlearning_hdb.xsjs', function (req, res) {

	var sqlString = exemObj.queryCurriculum(req, res);

	conn.connect(conn_params, function (err) {
		if (err) {
			if (err.code === 10) {
				result.status = 'error';
				result.message = err.message;
				console.log('error log:', err);
			}
			res.status(500).send(result);
		} else {

			var rows = conn.exec(sqlString, function (err, rows) {
				result.data = rows;
				res.status(200).send(result);
				conn.disconnect();
			});
		}
	});

});

app.post('/userlearning_hdb.xsjs', function (req, res) {
	var sqlString = exemObj.updateCurriculum(req, res);

	conn.connect(conn_params, function (err) {
		if (err) {
			if (err.code === 10) {
				result.status = 'error';
				result.message = err.message;
				console.log('error log:', err);
			}
			res.status(500).send(result);
		} else {
			conn.exec(sqlString, function (err, rows) {
				res.status(200).send(result);
				conn.disconnect();
			});

		}
	});

});

const port = process.env.PORT || 3000;

app.listen(port, function () {
	console.log('app listening on port ' + port);
});
