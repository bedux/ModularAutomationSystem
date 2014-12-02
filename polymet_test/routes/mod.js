/** @module albums/router */
'use strict';

var express = require('express');
var router = express.Router();
var middleware =  require('./middleware');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var Module = mongoose.model('Module');
var Device = mongoose.model('Device');
var Log = mongoose.model('Log');

var arduino = require("./arduinoComunication");


//allowed methods
router.all('/', middleware.supportedMethods('GET, POST'));

//get module with id
router.get('/:moduleid', function(req, res, next) {

  Module.findById(req.params.moduleid).lean().exec(function(err, mod){
    if (err) return next (err);

    if (!mod) {
    	res.status(404);
    	res.json({message: "not found"});
    }

    res.json(mod);
  });
});

//get all modules
router.get('/', function(req, res, next) {

    Module.find({}).lean().exec(function(err, modules) {
        if (err) return next (err);

        res.json(modules);
    })
});

//get module with device
router.get('/bydevice/:deviceid', function(req, res, next) {

    Module.find({devices: req.params.deviceid}).lean().exec(function(err, modules) {
        if (err) return next(err);

        res.json(modules);
    })
});

//create new module
router.post('/', function(req, res, next) {
    var newModule = new Module(req.body);
    newModule.save(onModelSave(res, 201, true));

});


function saveAndSend(json) {
  Module.findOne({devices : json.id},function(err,found){
    if(found){
      Device.findOne({_id:json.id},function(err,found1){
      if(found1){
      var pin=found1.pin;

      var log= new Log();
     log.title="Change Device State.";
    log.msg="Name:"+found.name;
    log.save();
      arduino.sendMessage(JSON.parse('{"ip":"' + found.ip + '","action":[{"'+ pin + '":"'+json.status+'"}]}'));
      found1.state=json.status;
      found1.save(function(err,saved){console.log(err,saved)});
      }});

    }
  });
}


router.post('/send', function(req, res, next) {
    console.log(req.body);
    saveAndSend(req.body);
    res.status(200).end();
});






function onModelSave(res, status, sendItAsResponse){
  var statusCode = status || 204;
  var sendItAsResponse = sendItAsResponse || false;
  return function(err, saved){
    if (err) {
      if (err.name === 'ValidationError' 
        || err.name === 'TypeError' ) {
        res.status(400)
        return res.json({
          statusCode: 400,
          message: "Bad Request"
        });
      }else{
        return next (err);
      }
    }
    if( sendItAsResponse){
      var obj = saved.toObject();
      delete obj.password;
      delete obj.__v;
      res.status(statusCode)
      return res.json(obj);
    }else{
      return res.status(statusCode).end();
    }
  }
};








module.exports = router;