const passport = require('passport');
const User = require('../models/User');
const jwt = require('jsonwebtoken')

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.facebookLogin = async (req, res, done) => {
    const { profile } = req.body;
    if (req.user) {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
            if (err) {
                return authFailed(res, err);
            }
            if (existingUser) {
                return authFailed(res, err);
            } else {
                User.findById(req.user.id, (err, user) => {
                    if (err) { return done(err); }
                    user.facebook = profile.id;
                    user.tokens.push({ kind: 'facebook', accessToken });
                    user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
                    user.profile.gender = user.profile.gender || profile._json.gender;
                    user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
                    user.save((err) => {
                        return loginAsUser(req, res, user);
                    });
                });
            }
        });
    } else {
        User.findOne({ facebook: profile.id }, (err, existingUser) => {
            console.log(existingUser);
            if (err) {
                return authFailed(res, err);
            }
            if (existingUser) {
                return loginAsUser(req, res, existingUser);
            }
            User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
                if (err) {
                    return authFailed(res, err);
                }
                if (existingEmailUser) {
                    return authFailed(res, err);
                } else {
                    const user = new User();
                    user.email = profile._json.email;
                    user.facebook = profile.id;
                    user.tokens.push({ kind: 'facebook', accessToken });
                    user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
                    user.profile.gender = profile._json.gender;
                    user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
                    user.profile.location = (profile._json.location) ? profile._json.location.name : '';
                    user.save((err) => {
                        if (err) {
                            return authFailed(res, err);
                        }
                        
                        return loginAsUser(req, res, existingUser);
                    });
                }
            });
        });
    }
};

const authFailed = (res, err) => {
    return res.status(400).send({ success: 0, message: err });
}

const loginAsUser = (req, res, user) => {
    req.logIn(user, function(err){
        if(err){
            return authFailed(res, err);
        }

        //We don't want to store the sensitive information such as the
        //user password in the token so we pick only the email and id
        const body = { _id : user._id, email : user.email };
        //Sign the JWT token and populate the payload with the user email and id
        const token = jwt.sign({ user : body }, process.env.JWT_SECRET);
        //Send back the token to the user
        return res.json({ success: 1, profile: {
            ...user.profile, 
            email: user.email
        }, token });
    });
}
