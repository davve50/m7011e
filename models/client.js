const mongoose = require('mongoose');

// Client schema
const ClientSchema = mongoose.Schema({
	type:{
		type: Number,
		required : true,
	},
	buffer:{
		type: Number,
		required : true,
	},
	consumption:{
		type: Number,
		required : true,
	},
	production:{
		type: Number,
		required : true,
	},
	ratio_buffer:{
		type: Number,
		required: true,
	},
	rate: {
		type: Number,
		required: false,
	},
	status: {
		type: Number,
		require: false,
	} 
});

const Client = module.exports = mongoose.model('Client', ClientSchema);

