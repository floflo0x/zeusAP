const express = require('express');

const { body, validationResult } = require("express-validator");

const axios = require('axios');

const FormData = require('form-data');

const router = express.Router();

const baseUrl = 'https://glowbal.co.uk/api/';

const isAuth = require("../middleware/is_auth");

// const baseUrl2 = 'https://glowbal.co.uk/api/';

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

const getData2 = (method, data = null) => {
  let config = {
    method: method,
    maxBodyLength: Infinity,
    url: baseUrl,
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

router.get("/v1/home", isAuth, async (req, res, next) => {
	try {
		const pgno = parseInt(req.query.pgno) || 1;

		let offset = 0;

		offset = pgno == 1 ? 0 : 5 * (pgno - 1);

		// console.log(pgno, offset);

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message;
		}
		else {
			message = null;
		}

		const postData = { 'offset': offset };
		const response = await axios.request(getData("get/home.php", "post", postData));
		const data = response.data;

		// console.log(data);

		const seasonCount = data && data.length >= 1 ? await Promise.all(data.map(async (i) => {
		    const postData2 = { 'videoId': i.videoId };
		    const response2 = await axios.request(getData("get/videoSeasonCount.php", "post", postData2));
		    const data2 = response2.data;

		    return {
		        id: i.videoId,
		        count: data2[0].count
		    };
		})) : [];

		// console.log(seasonCount);

		const mergedData = data.map(item => {
		  const match = seasonCount.find(d => d.id === item.videoId);
		  return {
		    ...item,
		    count: match ? match.count : '0' // Add count if match exists, else default to '0'
		  };
		});

		// console.log(mergedData);

		return res.render("home", {
			title: "Home",
			errorMessage: message,
			data: mergedData,
			currentPage: pgno
		})
	}
	catch(error) {
		console.log("home error", error);
	}
})

router.get("/v1/add", isAuth, async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message;
		}
		else {
			message = null;
		}

		return res.render("add2", {
			title: "Add Movies",
			// edit: false,
			editing: false,
			errorMessage: message,
			oldInput: {
				title: '',
  			description: '',
  			portrait_image: '',
  			fileCode: '',
  			video_length: ''
			},
		})
	}

	catch(error) {
		console.log("add movies get error", error);
	}
})

router.post("/v1/add",
	[
		body('title')
			.trim()
			.notEmpty()
			.withMessage('Title is required.')
			.matches(/^[^<>]*$/)
			.withMessage('Invalid Title...'),
	  	body("description")
	  		.trim()
	  		.notEmpty()
	  		.withMessage("Description is required")
	  		.matches(/^[^<>]*$/)
	  		.withMessage('Invalid Description...'),
	  	body("portrait_image").trim().notEmpty().withMessage("Portrait Image is required").escape(),
	  	body("fileCode").trim().notEmpty().withMessage("Video is required").escape(),
	  	body("video_length")
	  		.trim()
	  		.notEmpty()
	  		.isNumeric() // Ensure it contains only numbers
    		.withMessage("Video length must be a number.")
	],
	async (req, res, next) => {
		try {
			// console.log(req.body);

			const { title, description, portrait_image, fileCode, video_length } = req.body;

			// console.log(title, description, logo, portrait_image, fileCode);
			console.log(typeof title, typeof description, typeof portrait_image, typeof fileCode);

			const cleanedTitle = title.trim();
			const cleanedDescription = description.trim();

			// console.log(req.body, cleanedTitle, cleanedDescription);

			// ${(oldInput.description && oldInput.description[index-1]) || ''}

			const error = validationResult(req);

	    if (!error.isEmpty()) {
				// console.log(error.array());

				let msg1 = error.array()[0].msg;

				return res.render("add2", {
					title: "Add Movies",
					// edit: false,
					editing: false,
					errorMessage: msg1,
					oldInput: {
						title: cleanedTitle,
		  			description: cleanedDescription,
		  			portrait_image: portrait_image,
		  			fileCode: fileCode,
		  			video_length: video_length
					}
				})
			}

			else {
				let data = JSON.stringify({
				  	"title": title,
				  	"description": description,
				  	"image": portrait_image,
				  	"video": fileCode,
				  	"video_length": video_length
				});

				let config = {
				  	method: 'post',
				  	maxBodyLength: Infinity,
				  	url: baseUrl + 'insert/video.php',
				  	headers: { 
				  	  'Content-Type': 'application/json'
				  	},
				  	data : data
				};

				const response1 = await axios.request(config);
				const data1 = response1.data;

				// console.log(data1);

				if (data1 && data1.isSuccess == true) {
					return res.redirect("/v1/home");
				}
				else {
					req.flash('error', 'Failed to Add Movie... Try Again...');
					return res.redirect("/v1/add");
				}
			}
		}

		catch(error) {
			console.log("post add movie ", error);
		}
	}
)

router.get("/v1/add2", isAuth, async (req, res, next) => {
	try {
		// console.log(req.query);
		const { id } = req.query;

		// console.log(id);

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message;
		}
		else {
			message = null;
		}

		return res.render("add3", {
			title: "Add Series",
			// edit: false,
			editing: false,
			errorMessage: message,
			oldInput: {
				id: id,
				season: '',
				stitle: '',
				sdescription: '',
				title: [],
  			description: [],
  			portrait_image: [],
  			fileCode: [],
  			video_length: [],
			},
			count: 1
		})
	}

	catch(error) {
		console.log("add series get error", error);
	}
})

router.post("/v1/add2",
	[
		body('stitle')
			.trim()
			.notEmpty()
			.withMessage('Season Title is required.')
			.matches(/^[^<>]*$/)
			.withMessage('Invalid Season Title...'),
	  body("sdescription")
	  	.trim()
	  	.notEmpty()
	  	.withMessage("Season Description is required")
	  	.matches(/^[^<>]*$/)
	  	.withMessage('Invalid Season Description...'),
	  body("id").trim().notEmpty().isNumeric().withMessage("Id is required"),
	  body("season")
	  	.trim()
	  	.notEmpty()
	  	.isNumeric() // Ensure it contains only numbers
    	.withMessage("Season Number must be a number."),
    // Custom validation for empty arrays
    body('title')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Title must not be empty.');
        }
        return true;
    }),

    body('description')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Description must not be empty.');
        }
        return true;
    }),

    body('portrait_image')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Image must not be empty.');
        }
        return true;
    }),

    body('fileCode')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Video must not be empty.');
        }
        return true;
   	}),

    body('video_length')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Video length must not be empty.');
        }
        return true;
    }),
	],
 	async (req, res, next) => {
		try {
			// console.log(req.body);

			const { id, season, stitle, sdescription, title, description, portrait_image, fileCode, video_length } = req.body;

			// console.log(title, description, logo, portrait_image, fileCode);
			// console.log(typeof title, typeof description, typeof logo, typeof portrait_image, typeof fileCode);

			const cleanedTitle = (typeof title == 'object') ? title.map(i => i.trim('')) : [title.trim()];
			const cleanedDescription = (typeof description == 'object') ? description.map(i => i.trim('')) : [description.trim()];
			const csDes = sdescription.trim();
			const pi = (typeof portrait_image == 'object') ? portrait_image : [portrait_image];
			const fc = (typeof fileCode == 'object') ? fileCode : [fileCode];
			const vl = (typeof video_length == 'object') ? video_length : [video_length];

			// console.log(cleanedTitle, cleanedDescription);

			// ${(oldInput.description && oldInput.description[index-1]) || ''}

			const error = validationResult(req);

	    if (!error.isEmpty()) {
				// console.log(error.array());

				let msg1 = error.array()[0].msg;

				return res.render("add3", {
					title: "Add Series",
					// edit: false,
					editing: false,
					errorMessage: msg1,
					oldInput: {
						id: id,
						season: season,
						stitle: stitle,
						sdescription: csDes,
						title: cleanedTitle,
		  			description: cleanedDescription,
		  			portrait_image: pi,
		  			fileCode: fc,
		  			video_length: vl
					},
					count: cleanedTitle.length >= 1 ? cleanedTitle.length : 1
				})
			}

			else {
				let data = JSON.stringify({
				  "video_id": id,
				  "season_number": season,
				  "title": stitle,
				  "description": csDes,
				  "ep_title": cleanedTitle,
				  "ep_description": cleanedDescription,
				  "ep_image": pi,
				  "ep_video": fc,
				  "ep_video_length": vl
				});

				let config = {
				  method: 'post',
				  maxBodyLength: Infinity,
				  url: baseUrl + 'insert/season.php',
				  headers: { 
				    'Content-Type': 'application/json'
				  },
				  data : data
				};

				const response1 = await axios.request(config);
				const data1 = response1.data;

				// console.log(data1);

				if (data1 && data1.isSuccess == true) {
					return res.redirect("/v1/home");
				}
				else {
					req.flash('error', 'Failed to Add Season... Try Again...');
					return res.redirect(`/v1/add2/?id=${id}`);
				}
			}
		}

		catch(error) {
			console.log("add series error ", error);
			return res.redirect("/v1/home");
		}
	}
)

router.post("/v1/delete", async (req, res, next) => {
	try {
		// console.log(req.body.id);
		const { id } = req.body;

		const postData = { "id": id };
		const response1 = await axios.request(getData("delete/video.php", "post", postData));
		const data1 = response1.data;

		return res.redirect("/v1/home");
	}

	catch(error) {
		req.flash('error', "Failed to delete... Try Again...");
		return res.redirect("/v1/home");
	}
})

router.get("/v1/edit/:id", isAuth, async (req, res, next) => {
	try {
		const { id } = req.params;

		// console.log(id);

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message;
		}
		else {
			message = null;
		}

		const postData = { "id": id };
		const response1 = await axios.request(getData("get/videos.php", "post", postData));
		const data1 = response1.data;

		// console.log(data1);

		return res.render("add2", {
			title: "Edit Movies",
			editing: true,
			errorMessage: message,
			oldInput: {
				title: data1[0].title,
  			description: data1[0].description,
  			portrait_image: data1[0].image,
  			fileCode: data1[0].video,
  			video_length: data1[0].video_length,
  			id: data1[0].id
			}
		})
	}

	catch(error) {
		console.log("Edit Video error", error);
		return res.redirect("/v1/home");
	}
})

router.post("/v1/edit",
	[
		body('title')
			.trim()
			.notEmpty()
			.withMessage('Title is required.')
			.matches(/^[^<>]*$/)
			.withMessage('Invalid Title...'),
	  body("description")
	  	.trim()
	  	.notEmpty()
	  	.withMessage("Description is required")
	  	.matches(/^[^<>]*$/)
	  	.withMessage('Invalid Description...'),
	  body("portrait_image").trim().notEmpty().withMessage("Portrait Image is required").escape(),
	  body("fileCode").trim().notEmpty().withMessage("Video is required").escape(),
	  body("video_length")
	  	.trim()
	  	.notEmpty()
	  	.isNumeric() // Ensure it contains only numbers
    	.withMessage("Video length must be a number."),
    body("id")
    	.trim()
	  	.notEmpty()
	  	.isNumeric() // Ensure it contains only numbers
    	.withMessage("Id must be a number."),
	],
 	async (req, res, next) => {
		const { id } = req.body;

		try {
			// console.log(req.body);

			const { title, description, portrait_image, fileCode, video_length } = req.body;

			// console.log(title, description, logo, portrait_image, fileCode);
			// console.log(typeof title, typeof description, typeof portrait_image, typeof fileCode);

			const cleanedTitle = title.trim();
			const cleanedDescription = description.trim();

			// console.log(req.body, cleanedTitle, cleanedDescription);

			// ${(oldInput.description && oldInput.description[index-1]) || ''}

			const error = validationResult(req);

	    if (!error.isEmpty()) {
				// console.log(error.array());

				let msg1 = error.array()[0].msg;

				return res.render("add2", {
					title: "Edit Movies",
					editing: true,
					errorMessage: msg1,
					oldInput: {
						title: cleanedTitle,
		  			description: cleanedDescription,
		  			portrait_image: portrait_image,
		  			fileCode: fileCode,
		  			video_length: video_length,
		  			id: id
					}
				})
			}

			else {
				let data = JSON.stringify({
				  "id": id,
				  "title": title,
				  "description": description,
				  "image": portrait_image,
				  "video": fileCode,
				  "video_length": video_length
				});

				let config = {
				  method: 'post',
				  maxBodyLength: Infinity,
				  url: baseUrl + 'update/video.php',
				  headers: { 
				    'Content-Type': 'application/json'
				  },
				  data : data
				};

				const response1 = await axios.request(config);
				const data1 = response1.data;

				console.log(data1);

				if (data1 && data1.isSuccess == true) {
					return res.redirect("/v1/home");
				}
				else {
					req.flash("error", "Failed to Update... Try Again...");
					return res.redirect(`/v1/edit/${id}`);
				}
			}
		}

		catch(error) {
			console.log("Edit post error", error);
			return res.redirect(`/v1/edit/${id}`);
		}
	}
)

router.get("/v1/sedit/:sid", isAuth, async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message;
		}
		else {
			message = null;
		}

		const { sid } = req.params;
		const { vid } = req.query;

		// console.log(sid, vid);

		const postData = { "season": sid, "videoId": vid };
		const response1 = await axios.request(getData("get/episodesBySeason.php", "post", postData));
		const data1 = response1.data;

		// console.log(data1);

		const postData2 = { "vid": vid, "sid": sid };
		const response2 = await axios.request(getData("get/season.php", "post", postData2));
		const data2 = response2.data;

		// console.log(data2);

		const ep_title = data1.map(item => item.title.trim(''));
		const ep_description = data1.map(item => item.description.trim(''));
		const ep_image = data1.map(item => item.image);
		const ep_video = data1.map(item => item.video);
		const ep_videoLength = data1.map(item => item.video_length);

		return res.render("add3", {
			title: "Edit Series",
			editing: true,
			errorMessage: message,
			oldInput: {
				id: vid,
				sid: data2[0].season_id,
				season: data2[0].season_number,
				stitle: data2[0].title,
				sdescription: data2[0].description,
				title: ep_title,
  			description: ep_description,
  			portrait_image: ep_image,
  			fileCode: ep_video,
  			video_length: ep_videoLength,
			},
			count: data1.length
		})
	}

	catch(error) {
		console.log("Season Edit error", error);
		return res.redirect("/v1/home");
	}
})

router.post("/v1/sedit",
	[
		body('stitle')
			.trim()
			.notEmpty()
			.withMessage('Season Title is required.')
			.matches(/^[^<>]*$/)
			.withMessage('Invalid Season Title...'),
	  body("sdescription")
	  	.trim()
	  	.notEmpty()
	  	.withMessage("Season Description is required")
	  	.matches(/^[^<>]*$/)
	  	.withMessage('Invalid Season Description...'),
	  body("id").trim().notEmpty().isNumeric().withMessage("Id is required"),
	  body("season")
	  	.trim()
	  	.notEmpty()
	  	.isNumeric() // Ensure it contains only numbers
    	.withMessage("Season Number must be a number."),
    // Custom validation for empty arrays
    body('title')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Title must not be empty.');
        }
        return true;
    }),

    body('description')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Description must not be empty.');
        }
        return true;
    }),

    body('portrait_image')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Image must not be empty.');
        }
        return true;
    }),

    body('fileCode')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Video must not be empty.');
        }
        return true;
   	}),

    body('video_length')
      .custom(value => {
        if (!Array.isArray(value) || value.length === 0 || value.every(img => img.trim() === '')) {
          throw new Error('Episode Video length must not be empty.');
        }
        return true;
    }),
	],
 	async (req, res, next) => {
		try {
			// console.log(req.body);

			const { id, sid, season, stitle, sdescription, title, description, portrait_image, fileCode, video_length } = req.body;

			// console.log(title, description, logo, portrait_image, fileCode);
			// console.log(typeof title, typeof description, typeof logo, typeof portrait_image, typeof fileCode);

			const cleanedTitle = (typeof title == 'object') ? title.map(i => i.trim('')) : [title.trim()];
			const cleanedDescription = (typeof description == 'object') ? description.map(i => i.trim('')) : [description.trim()];
			const csDes = sdescription.trim();
			const pi = (typeof portrait_image == 'object') ? portrait_image : [portrait_image];
			const fc = (typeof fileCode == 'object') ? fileCode : [fileCode];
			const vl = (typeof video_length == 'object') ? video_length : [video_length];

			// console.log(cleanedTitle, cleanedDescription);

			// ${(oldInput.description && oldInput.description[index-1]) || ''}

			const error = validationResult(req);

	    if (!error.isEmpty()) {
				// console.log(error.array());

				let msg1 = error.array()[0].msg;

				return res.render("add3", {
					title: "Edit Series",
					editing: true,
					errorMessage: msg1,
					oldInput: {
						id: id,
						sid: sid,
						season: season,
						stitle: stitle,
						sdescription: csDes,
						title: cleanedTitle,
		  			description: cleanedDescription,
		  			portrait_image: pi,
		  			fileCode: fc,
		  			video_length: vl
					},
					count: cleanedTitle.length >= 1 ? cleanedTitle.length : 1
				})
			}

			else {
				let data = JSON.stringify({
				  "id": sid,
				  "video_id": id,
				  "season_number": season,
				  "title": stitle,
				  "description": csDes,
				  "ep_title": cleanedTitle,
				  "ep_description": cleanedDescription,
				  "ep_image": pi,
				  "ep_video": fc,
				  "ep_video_length": vl 				
				});

				let config = {
				  method: 'post',
				  maxBodyLength: Infinity,
				  url: baseUrl + 'update/season.php',
				  headers: { 
				    'Content-Type': 'application/json'
				  },
				  data : data
				};

				const response1 = await axios.request(config);
				const data1 = response1.data;

				// console.log(data1);

				if (data1 && data1.isSuccess) {
					return res.redirect("/v1/home");
				}

				else {
					return res.redirect(`/v1/sedit/<%= sid %>?id=<%= id %>`)
				}
			}
		}

		catch(error) {
			console.log("post edit season error", error);
			return res.redirect("/v1/home");
		}
	}
)

module.exports = router;