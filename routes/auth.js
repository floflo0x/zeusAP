const express = require('express');

const { body, validationResult } = require("express-validator");

const axios = require('axios');

const FormData = require('form-data');

const crypto = require("crypto");

const router = express.Router();

const baseUrl = 'https://glowbal.co.uk/api/';

const getData = (url, method, data = null) => {
  let config = {
    method: method,
    maxBodyLength: Infinity,
    url: baseUrl + url,
    headers: {},
  };

  // console.log(method.toLowerCase());

  if (method.toLowerCase() === "post" && data) {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    config.data = formData;
    config.headers = { ...formData.getHeaders() }; // Set headers for form data
  }

  return config;
};

router.get("/", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render("login", {
			title: 'Login',
			errorMessage: message,
			oldInput: {
				user: ''
			}
		})
	}

	catch(error) {
		console.log("login error", error);
	}
})

router.post("/",
	[
	    body("user")
	      .trim()
	      .notEmpty()
	      .withMessage("User required")
	      .matches(/^[^<>]*$/)
	      .withMessage("Invalid user or password"),
	    body("password")
	      .trim()
	      .notEmpty()
	      .withMessage("Password required")
	      .matches(/^[^<>]*$/)
	      .withMessage("White space not allowed")
  	],
 	async (req, res, next) => {
		const { user, password } = req.body;
		// console.log(req.body);

    	try {
      		const error = validationResult(req);

	    	if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				return res.render("login", {
					title: 'Login',
					errorMessage: msg1,
					oldInput: {
						user: user
					}
				})
			}

			else {
				const postData = { 'email': user, 'password': password };

				const response = await axios.request(getData("auth/admin_login.php", 'post', postData));
				const data1 = response.data;
        		// console.log(data1);

				if (data1.isSuccess) {
					// console.log(data1);
		                
		      		res.cookie("_prod_isLoggedIn", true);
          
          			return res.redirect("/v1/home");
				}
				
				else {
          			res.cookie("_prod_isLoggedIn", false);
					req.flash("error", "Invalid user and passowrd. Try again...");
					return res.redirect("/");
				}
			}
		}

		catch(error) {
			return res.redirect("/");
		}
	}
)

router.get("/logout", async (req, res, next) => {
	// const postData2 = { 'q1': `DELETE from hSession where email = '${req.session.name}'` };
	// const response2 = await axios.request(selectUrl('post', postData2));

  	req.session.destroy((err) => {
    	// console.log(err);
    	res.clearCookie('_prod_isLoggedIn');
      
    	return res.redirect("/");
  	});
});

module.exports = router;