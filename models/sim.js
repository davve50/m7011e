let mongoose = require('mongoose');

// Sim schema
let SimSchema = mongoose.Schema({
	total_consumption:{
		type: Number,
		required : true,
	},
	total_production:{
		type: Number,
		required : true,
	},
	price:{
		type: Number,
		required: true,
	},
	wind:{
		type: Number,
		required: true,
	},
	consumers:{
		type: Number,
		required: true,
	}
});

let Sim = module.exports = mongoose.model('Sim', SimSchema);

