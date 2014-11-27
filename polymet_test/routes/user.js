/** @module albums/router */
'use strict';

var express = require('express');
var router = express.Router();
var middleware =  require('./middleware');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var User = mongoose.model('User');

//allowed methods
router.all('/', middleware.supportedMethods('GET, POST'));

//get user with id
router.get('/:userid', function(req, res, next) {

  User.findById(req.params.userid).lean().exec(function(err, user){
    if (err) return next (err);

    if (!user) {
    	res.status(404);
    	res.json({message: "not found"});
    }

    res.json(user);
  });
});

//create new user
router.post('/', function(req, res, next) {
    var newUser = new User(req.body);
    newUser.save(onModelSave(res, 201, true));
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