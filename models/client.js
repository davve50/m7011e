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
	rate_change: {
		type: Number,
		required: false,
	},
	status: {
		type: Number,
		required: false,
	},
	status_change: {
		type: Number,
		require: false,
	},
	time: {
		type: Date,
		require: false,
	},
	active:{
                type: Date,
                required: true,
        },
	blackout:{
		type: Number,
		required: false,
	}
});

const Client = module.exports = mongoose.model('Client', ClientSchema);

