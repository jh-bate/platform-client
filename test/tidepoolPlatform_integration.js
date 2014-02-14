// == BSD2 LICENSE ==
// Copyright (c) 2014, Tidepool Project
//
// This program is free software; you can redistribute it and/or modify it under
// the terms of the associated License, which is identical to the BSD 2-Clause
// License as published by the Open Source Initiative at opensource.org.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the License for more details.
//
// You should have received a copy of the License along with this program; if
// not, you can obtain one from Tidepool Project at tidepool.org.
// == BSD2 LICENSE ==

'use strict';
var expect = require('salinity').expect;
var userId;

describe('platform client', function() {

  var platform;
  var user = {
      username : 'fake',
      password : 'fak3U53r',
      emails :['fake@user.com']
    };

  var createUser=function(cb){
    //try login first then create user if error
    platform.login(user,function(error,data){
      userId = data.userid;

      if(error){
        platform.signUp(user,cb);
      }
      cb(null,null);
    });
  };

  var addUserTeamGroup=function(cb){
    console.log('add team');
    platform.addGroupForUser(userId, { members : [userId]}, 'team', function(error,data){
      cb(error,data);
    });
  };

  before(function(done){

    platform = require('../index')('http://localhost:8009');

    createUser(function(error,data){
      if(error){
        throw error;
      }
      done();
    });

  });

  it('logs in user', function(done) {
    platform.login(user,function(error,data){
      expect(error).to.not.exist;
      expect(data).to.exist;
      done();
    });
  });

  describe('get team',function(){

    before(function(done){

      addUserTeamGroup(function(error,data){
        if(error){
          throw error;
        }
        done();
      });

    });

    it('returns the team asked for', function(done) {
      platform.getGroupForUser(userId,'team',function(error,data){
        expect(error).to.not.exist;
        expect(data).to.exist;
        done();
      });
    });

  });

  describe('messages',function(){

    var groupId;

    before(function(done){

      addUserTeamGroup(function(error,data){
        if(error){
          throw error;
        }
        groupId = data;
        done();
      });

    });

    it('add a note and then comment on it, then get the whole thread', function(done) {

      var message = {
        userid : userId,
        groupid : groupId,
        timestamp : Date(),
        messagetext : 'In three words I can sum up everything I have learned about life: it goes on.'
      };
      //add note
      platform.startMessageThread(groupId, message, function(error,data){
        expect(error).to.not.exist;
        expect(data).to.exist;

        var messageId = data;

        var comment = {
          userid : userId,
          groupid : groupId,
          timestamp : Date(),
          messagetext : 'Good point bro!'
        };
        //comment on the note
        platform.replyToMessageThread(messageId,comment, function(error,data){

          expect(error).to.not.exist;
          expect(data).to.exist;

          //get the whole thread
          platform.getMessageThread(messageId, function(error,data){
            expect(error).to.not.exist;
            expect(data).to.exist;
            expect(data.length).to.equal(2);
            var firstMessage = data[0];
            var secondMessage = data[1];

            expect(firstMessage.groupid).to.equal(groupId);
            expect(secondMessage.groupid).to.equal(groupId);
            expect(firstMessage.parentmessage).to.not.exist;
            expect(firstMessage.messagetext).to.equal(message.messagetext);
            expect(secondMessage.parentmessage).to.equal(firstMessage.id);
            expect(secondMessage.messagetext).to.equal(comment.messagetext);
            done();
          });

        });

      });
    });

    it.skip('all messages for the group from the last two weeks', function(done) {
      //TODO
      var twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);

      platform.getAllMessagesForTeam(groupId, twoWeeksAgo,Date(), function(error,data){
        expect(error).to.not.exist;
        expect(data).to.exist;
        done();
      });
    });

  });

});