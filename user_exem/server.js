/*eslint no-console: 0*/
"use strict";
const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
const hana = require('@sap/hana-client');
const exemObj = require('./service/zlms_app_exem');

const JWTStrategy = require('@sap/xssec').JWTStrategy;
const app = express();
const services = xsenv.getServices({
	uaa: 'uaa_UserDetail'
});

passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());
app.use(passport.authenticate('JWT', {
	session: false
}));

// 载入fs模块
const fs = require('fs');

// eslint-disable-next-line no-unused-vars
app.get('/user', function (req, res, next) {
	var user = req.user;
	var result = JSON.stringify(user);
	// res.send(req.user.id);
	res.send(result);
});
//hana DB
const conn = hana.createConnection();

// read HDB_config.json 配置文件
fs.readFile('./service/HDB_config.json', function (err, data) {
	if (err)
		throw err;

	var jsonObj = JSON.parse(data);

	for (var i = 0, size = jsonObj.length; i < size; i++) {
		var record = jsonObj[i];
		var serverNode = record['serverNode'];
		var uid = record['uid'];
		var pwd = record['pwd'];
		var encrypt = record['encrypt'];
		var sslValidateCertificate = record['sslValidateCertificate'];

		conn_params.serverNode = serverNode;
		conn_params.uid = uid;
		conn_params.pwd = pwd;
		conn_params.encrypt = encrypt;
		conn_params.sslValidateCertificate = sslValidateCertificate;
	}
});

var result = {
	status: "success"
};

app.get('/programstatus_hdb.xsjs',function (req,res){
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

app.post('/programstatus_hdb.xsjs',function (req,res){

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

app.get('/userlearning_hdb.xsjs',function (req,res){

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

app.post('/userlearning_hdb.xsjs',function (req,res){
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
