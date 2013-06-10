/*
 * Self-contained node.js test app for jQuery-File-Upload
 * (https://github.com/blueimp/jQuery-File-Upload)
 * Andrew Magee http://studstudy.com
 * (MIT licence http://www.opensource.org/licenses/MIT)
 *
 * Adapted from:
 * jQuery File Upload Plugin Node.js Example 2.0 https://github.com/blueimp/jQuery-File-Upload
 * Copyright 2012, Sebastian Tschan https://blueimp.net (MIT licence http://www.opensource.org/licenses/MIT)
 */

/*jslint nomen: true, regexp: true, unparam: true, stupid: true */
/*global require, __dirname, unescape, console */

var path = require('path');
var fs = require('fs');
var formidable = require('formidable');
var my = require("./my.class.js");
var _ = require("underscore");
var express = require('express');


var UploadServer = my.Class({
  /**
    new UploadServer({ port: 8888 });
  */
  constructor: function(opts) {
    var self = this;
    var options = this.options = _.extend({
      port: 8888,
      tempDir: __dirname + '/tmp',
      uploadDir: __dirname + '/uploaded_files',
      accessControl: {
        allowOrigin: '*',
        allowMethods: 'OPTIONS, POST'
      },
    }, opts);

    var app = express();

    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname + "/public"));

    app.get('/', function(req, res) {
      res.sendfile("views/index.html");
    });

    app.post('/upload', function(req, res){
      res.setHeader('Access-Control-Allow-Origin', self.options.accessControl.allowOrigin);
      res.setHeader('Access-Control-Allow-Methods', "POST");
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Disposition', 'inline; filename="files.json"');

      var tempFileNames = [];
      var files = [];
      var fileLookup = {};
      var form = new formidable.IncomingForm();
      form.uploadDir = self.options.tempDir;
      form.on('fileBegin', function (name, file) {
        tempFileNames.push(file.path);
        fileLookup[path.basename(file.path)] = file;
        files.push(file);
      }).on('file', function(name, file) {
        var fileInfo = fileLookup[path.basename(file.path)];
        fileInfo.size = file.size;
        fs.renameSync(file.path, self.options.uploadDir + '/' + fileInfo.name);
      }).on('aborted', function() {
        tempFileNames.forEach(function(file) { fs.unlink(file); });
      }).on('error', function (e) {
        console.log(e);
      }).on('progress', function(bytesReceived, bytesExpected) {
      }).on('end', function() {
        res.writeHead(200, {
          'Content-Type': req.headers.accept.indexOf('application/json') !== -1 ?
                          'application/json' : 
                          'text/plain'
        });
        res.end(JSON.stringify({ files: files }));
      }).parse(req);
    });

    app.listen(options.port);
  }
});


new UploadServer({ port: 8888 });

module.exports = {
  UploadServer: UploadServer
};
