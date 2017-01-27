var mongoose = require("mongoose");
var bcrypt = require('bcrypt');
var ObjectId = mongoose.Schema.Types.ObjectId;
var utils = require("../javascripts/utils.js");
var email = require('../javascripts/email.js');
var enums = require("../javascripts/enums.js");
var authentication = require('../javascripts/authentication.js');
var validators = require("mongoose-validators");
var regexs = require("../javascripts/regexs.js");
var mongooseToCsv = require("mongoose-to-csv");

var UserSchema = mongoose.Schema({
    username: {type: String, required: true, index: true},
    password: {type: String, required: true}, // should be just the hash
    verified: {type: Boolean, default: false},
    verificationToken: {type:String, default: null},
    approved: {type: Boolean, default: false},
    rejected: {type: Boolean, default: false},
    requestToken: {type: String, default: null},
    inPool: {type: Boolean, default: false}, 
    onHold: {type: Boolean, default: false},
    archived: {type: Boolean, default: false},
    role: {type: String, enum: enums.userTypes(), required: true},
    email: {type: String, required: true},
    alternativeEmail: {type: String, default: null},
    firstName: {type: String, required: true},
    middleName: {type: String, default:null},
    lastName: {type: String, required: true},
    nickname: {type: String, default:null},
    gender: {type: String, enum: enums.genders(), default:null},
    dateOfBirth: {type: Date, default:null},
    phoneNumber: {type: String, require: true},
    skypeId: {type: String, default:null},
    school: {type: String, default:null},
    educationLevel: {type: String, default:null},
    enrolled: {type: String, default:null},
    major: {type: String, default:null},
    country:{type: String, default:null},
    region: {type: String, default:null},
    timezone: {type: String, default:null},
    nationality: {type: String, default:null},
    interests: [{type: String, default:null}],
    countryInCharge: {type: String, default:null},
    regionInCharge: {type: String, default:null},
    schoolInCharge: {type: String, default:null}

});

UserSchema.plugin(mongooseToCsv, 
{
  headers: 'FirstName LastName UserName Email AltEmail Phone Gender DOB Country Region TimeZone Major educationLevel School Nationality Role SkypeID Interests InChargeOfRegion InChargeOfCountry InChargeOfSchool',
  constraints: {
    'Username': 'username',
    'Email': 'email',
    'DOB': 'dateofBirth',
    'FirstName': 'firstName',
    'LastName': 'lastName',
    'AltEmail': 'alternativeEmail',
    'Phone': 'phoneNumber',
    'SkypeID':'skypeId',
    'TimeZone': 'timezone',
    'Country': 'country',
    'Region': 'region',
    'Nationality': 'nationality',
    'Role': 'role',
    'Gender': 'gender',
    'School': 'school',
    'Major': 'major',
    'Interests': 'interests',
    'InChargeOfSchool': 'schoolInCharge',
    'InChargeOfRegion': 'regionInCharge',
    'InChargeOfCountry': 'countryInCharge',
    'educationLevel': 'educationLevel'

}

  });


UserSchema.path("role").validate(function(role) {
    if (utils.isRegularUser(role)) {
        if (!this.gender || !this.dateOfBirth || !this.skypeId || !this.interests || 
            !this.school || !this.educationLevel || !this.enrolled || !this.major ||
            !this.timezone || !this.nationality || !this.country || !this.region) {
            return false;
        }
    } else if (utils.isCoordinator(role)) {
        if (!this.countryInCharge && !this.regionInCharge && !this.schoolInCharge) {
            return false;
        }
    }
    return true;
}, "Missing required personal info from the user");

UserSchema.path("username").validate(function(username) {
    return username.trim().length >= enums.minUsernameLength() || 
                username.trim().length <= enums.maxUsernameLength();
}, "No empty username.");

UserSchema.path("password").validate(function(password) {
    return password.trim().length > 0;
}, "No empty passwords");

UserSchema.path("firstName").validate(function(firstName) {
    return firstName.trim().length > 0;
}, "No empty first names.");

UserSchema.path("lastName").validate(function(lastName) {
    return lastName.trim().length > 0;
}, "No empty last names.");

UserSchema.path("verificationToken").validate(function(verificationToken) {
    if (!this.verificationToken) {
        return true;
    }
    return this.verificationToken.length == enums.numTokenDigits();
}, "Verification token must have the correct number of digits");

UserSchema.path("requestToken").validate(function(verificationToken) {
    if (!this.requestToken) {
        return true;
    }
    return this.requestToken.length == enums.numTokenDigits();
}, "Request token must have the correct number of digits");

/**
* Sets a verification token for the user
* @param {String} token - the 32-digit verification token
* @param {Function} callback - the function that gets called after the token is set
*/
UserSchema.methods.setVerificationToken = function (token, callback) {
    this.verificationToken = token;
    this.save(callback);
};

/**
* Sets verified to true
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.verify = function (callback) {
    this.verified = true;
    this.save(callback);
};

/**
* Sets a request token for the user
* @param {String} token - the 32-digit request token
* @param {Function} callback - the function that gets called after the token is set
*/
UserSchema.methods.setRequestToken = function (token, callback) {
    this.requestToken = token;
    this.save(callback);
};

/**
* Sets approved to true
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.approve = function (callback) {
    this.approved = true;
    this.onHold = false;
    this.save(callback);
};

/**
* Sets reject to true
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.reject = function (callback) {
    this.rejected = true;
    this.approved = false;
    this.onHold = false;
    this.save(callback);
};

/**
* Puts the user on hold
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.waitlist = function (callback) {
    this.onHold = true;
    this.save(callback);
};

/**
* Archives the user
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.archive = function (callback) {
    this.archived = true;
    this.save(callback);
};

/**
* Puts the user to the poll
* @param {Function} callback - the function that gets called after
*/
UserSchema.methods.joinPool = function (callback) {
    this.onHold = false;
    this.save(callback);
};


/**
* Verifies the account so that user can start using it
* @param {String} username - username of the account to verify
* @param {String} token - the enums.numTokenDigits-digit verification token
* @param {Function} callback - the function that gets called after the account is verified
*/
UserSchema.statics.verifyAccount = function (username, token, callback) {
    this.findOne({username: username}, function (err, user) {
        if (err || (!err & !user)) {
            callback({success:false, message: 'Invalid username'});
        } else if (user.verified) {
            console.log('already verified');
            callback({success:false, isVerified: true, message: 'The account is already verified'}, user);
        } else if (user.verificationToken !== token) {
            callback({success:false, message: 'Invalid verification token'});
        } else {
            console.log('verifying...');
            user.verify(callback);
        }
    });
};

/**
* Verifies the account so that user can start using it
* @param {String} username - username of the account to verify
* @param {String} token - the enums.numTokenDigits-digit verification token
* @param {Boolean} approve - true 
* @param {Function} callback - the function that gets called after the account is verified
*/
UserSchema.statics.respondToAccountRequest = function (username, token, approve, waitlist, callback) {
    this.findOne({username: username}, function (err, user) {
        if (err || (!err & !user)) {
            callback({success:false, message: 'Invalid username'});
        } else if (user.approved && !user.onHold) {
            callback({success:false, message: 'The account is already approved'});
        } else if (user.rejected) {
            callback({success:false, message: 'The account is already rejected'});
        } else if (user.requestToken !== token) {
            callback({success:false, message: 'Invalid request token'});
        } else {
            if (approve) {
                user.approve(function (err, user) {
                    console.log('approved', err);
                    if (err) {
                        callback({success: false, message: 'Failed to approve account'});
                    } else if (waitlist) {
                        console.log('put on hold');
                        user.waitlist(callback);
                    } else {
                        callback(null, user);
                    }
                });    
            } else {
                console.log('rejected');
                user.reject(callback);
            }
        }
    });
};

UserSchema.statics.archiveUser = function (username, callback) {
    this.findOne({username: username}, function (err, user) {
        if (err || (!err & !user)) {
            callback({success:false, message: 'Invalid username'});
        } else if (user.archieved) {
            callback({success:false, message: 'The account is already approved'});
        } else {
            user.archive(callback);
        }
    });
}

/*
* Checks if the provided username and password correspond to any user
* @param {String} username - username of the account to grant authentication
* @param {String} password - password of the account to grant authentication 
* @param {Function} callback - the function that gets called after the check is done, err argument
*                              is null if the given username and password are valid, otherwise,
*                              err.message contains the appropriate message to show to the user
*/
UserSchema.statics.authenticate = function (username, password, callback) {
    this.findOne({ username: username }, function (err, user) {
        if (err || user === null) {
            callback({message:'Please enter a valid username'});
        } else {
            bcrypt.compare(password, user.password, function (err, response) {
                if (response === true) {
                    callback(null, {username: username,
                                    _id: user._id,
                                    verified: user.verified,
                                    approved: user.approved,
                                    rejected: user.rejected,
                                    archived: user.archived,
                                    onHold: user.onHold,
                                    inPool: user.inPool,
                                    role: user.role,
                                    fullName: user.firstName + ' ' + user.lastName});
                } else {
                    callback({message:'Please enter a correct password'});
                }
            });
        }
    }); 
};

/*
* Registers a new user with the given userJSON (only if there is no user
* with the given username)
* @param {Object} userJSON - json object containing the appropriate fields
* @param {Boolean} devMode - true if the app is in developer mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*                              contains the appropriate message to show to the user
*/
UserSchema.statics.signUp = function (userJSON, devMode, callback) {
    that = this;
    that.count({ username: userJSON.username }, function (err, count) {
        if (err) {
            return callback({success: false, message: 'Database error'});
        } else if (count === 0) {
            that.count({ email: userJSON.email }, function (err, count) {
                if (err) {
                    return callback({success: false, message: 'Database error'});
                } else if (count === 0) {
                    that.create(userJSON, function(err, user){
                        if (err) {
                            console.log('err', err);
                            return callback({success: false, message: err.message});
                        }
                        that.sendVerificationEmail(user.username, devMode, callback);
                    });
                } else {
                    callback({message: 'There is already an account with this email address.' 
                        + 'Please make sure you have entered your email address correctly'});
                }   
            });
            
        } else {
            callback({success: false, message: 'There is already an account with this username, '
                                + 'make sure you enter your username correctly'});
        }
    });
};

/*
* Sends a verification email to the user if there exists an account with such username.
* If devMode is true, send a verification link with localhost prefix, otherwise send the
* production URL prefix
* @param {String} username - username of the user 
* @param {Boolean} devMode - true if the app is in development mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*/
UserSchema.statics.sendVerificationEmail = function (username, devMode, callback) {
    that = this;
    that.count({ username: username }, function (err, count) {
        if (count === 0) {
            callback({message: 'Invalid username'});
        } else {
            that.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else if (user && !user.isVerified) {
                    email.sendVerificationEmail(user, devMode, callback);
                } else {
                    callback({message: 'Your account has already been verified. You can now log in.'});
                }
            });
        }
    });
};

/*
* Sends an approval email to the user if there exists an account with such username.
* @param {String} username - username of the user 
* @param {Boolean} devMode - true if the app is in development mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*/
UserSchema.statics.sendApprovalEmail = function (username, devMode, callback) {
    that = this;
    that.count({ username: username }, function (err, count) {
        if (count === 0) {
            callback({message: 'Invalid username'});
        } else {
            that.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else if (user && user.approved && !user.onHold) {
                    email.sendApprovalEmail(user, devMode, callback);
                } else {
                    callback({message: 'Cannot send an approval email to an account whose account has not been accepted'});
                }
            });
        }
    });
};

/*
* Sends a rejection email to the user if there exists an account with such username.
* @param {String} username - username of the user 
* @param {Boolean} devMode - true if the app is in development mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*/
UserSchema.statics.sendRejectionEmail = function (username, devMode, callback) {
    that = this;
    that.count({ username: username }, function (err, count) {
        if (count === 0) {
            callback({message: 'Invalid username'});
        } else {
            that.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else if (user && user.rejected && !user.approved) {
                    email.sendRejectionEmail(user, devMode, callback);
                } else {
                    callback({message: 'Cannot send an approval email to an account whose account has not been rejected'});
                }
            });
        }
    });
};

/*
* Sends a waitlist email to the user if there exists an account with such username.
* @param {String} username - username of the user 
* @param {Boolean} devMode - true if the app is in development mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*/
UserSchema.statics.sendWaitlistEmail = function (username, devMode, callback) {
    that = this;
    that.count({ username: username }, function (err, count) {
        if (count === 0) {
            callback({message: 'Invalid username'});
        } else {
            that.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else if (user && user.approved && user.onHold) {
                    email.sendWaitlistEmail(user, devMode, callback);
                } else {
                    callback({message: 'Cannot send an approval email to an account whose account has not been waitlisted'});
                }
            });
        }
    });
};

/*
* Sends an archive email to the user if there exists an account with such username.
* @param {String} username - username of the user 
* @param {Boolean} devMode - true if the app is in development mode, false otherwise
* @param {Function} callback - the function that gets called after the user is created, err argument
*                              is null if the given the registration succeed, otherwise, err.message
*/
UserSchema.statics.sendArchiveEmail = function (username, devMode, callback) {
    that = this;
    that.count({ username: username }, function (err, count) {
        if (count === 0) {
            callback({message: 'Invalid username'});
        } else {
            that.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else {
                    email.sendArchiveEmail(user, devMode, callback);
                }
            });
        }
    });
};

/*
 * Changes the password of a query user. 
 * @param {String} username - The username of the query user. 
 * @param {String} newPassword - The new password of the user. 
 * @param {Function} callback - The function to execute after the password is changed. Callback
 * function takes 1 parameter: an error when the request is not properly claimed
 */
UserSchema.statics.changePassword = function(username, newPassword, callback){
    this.findOne({username: username}, function (err, user) {
        if (err) {
            callback(new Error("Invalid username."));
        } else {
            authentication.encryptPassword(newPassword, function(err, hash){
                if (err){
                    callback(new Error("The new password is invalid."));
                } else {
                    user.password = hash;
                    user.save(callback); 
                }
            });
        }
    });
};


/*
 * Finds a user by their username and returns the whole user object. 
 * @param {String} username - The username of the query user.  
 * @param {Function} callback - The function to execute after the user is found. Callback
 * function takes 1 parameter: an error when the request is not properly claimed
 */
UserSchema.statics.getUser = function(username, callback){
    this.findOne({username: username}, function(err,user){
        if (err) {
            console.log("Invalid usernmae");
            callback(new Error("Invalid username."));
        } 
        else {
            callback(null, user);
        }
    });//end findOne
};

UserSchema.statics.searchUsers = function(name, callback){
    this.find({$and: [{$or: [{firstName: new RegExp(["^", name, "$"].join(""), "i")},
                        {lastName: new RegExp(["^", name, "$"].join(""), "i")}]}, 
                    {$and: [{verified: true, approved: true}]}]},
        function (err, users){
        if (err) {
            console.log("Invalid usernmae");
            callback(new Error("Invalid username."));
        } 
        else {
            callback(null, users);
        }
    });//end findOne
};

UserSchema.statics.getPendingUsers = function (callback) {
    // {$or: [{student: user._id}, {tutor: user._id}]}
    this.find({$and: [{verified: true}, 
                        {$or: [{$and: [{approved:false}, {rejected: false}, {onHold: false}]}, 
                                {onHold: true, approved: true}]}]}, function (err, users) {
        if (err) {
            callback({success: false, message: err.message});
        } else {
            callback(null, users);
        }
    });
}


UserSchema.statics.getAllUsers = function(){
    console.log("trying to make csv");
    this.find({}).stream().pipe(this.csvTransformStream()).pipe(fs.createWriteStream('users.csv'));
    console.log("made csv");
};

UserSchema.statics.findCoordinator = function (userId, callback) {
    var that = this;
    that.findOne({_id: userId}, function (err, user) {
        if (err) {
           callback({success: false, message: err.message});
        } else {
            that.findOne({$or: [{schoolInCharge: user.school}, {regionInCharge: user.region}, {countryInCharge: user.country}]}, function (err, coordinator) {
                if (err) {
                  callback({success: false, message: err.message});
                } else {
                  callback(null, coordinator);
                }               
            });
        }
    });
}



var UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
