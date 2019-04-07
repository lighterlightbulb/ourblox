/* Copyright 2019 Ourblox, All Rights Reserved */

var exports = module.exports = {}

const body = `
<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns1="http://ourblox.pw/" xmlns:ns2="http://ourblox.pw/RCCServiceSoap" xmlns:ns2="http://ourblox.pw/RCCServiceSoap12">
<SOAP-ENV:Body SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">`

const bodyEnd = `
</SOAP-ENV:Body>
</SOAP-ENV:Envelope>`

exports.body = body;
exports.bodyEnd = bodyEnd;