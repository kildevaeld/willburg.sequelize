'use strict';

const resources = require('../lib/resource')

let test = {"$and":[["end > ? AND active = '1'","2016-07-25T16:15:33.077Z"],{"$or":{"title":{"$like":"%wen%"},"$acts.name$":{"$like":"%wen%"},"description":{"$like":"%wen%"},"description_english":{"$like":"%wen%"}}}]}

describe('resources', () => {

	it('should', () => {
		let has = resources.hasAssociatedQuery({where: test, limit: 100})
		console.log(has)
	});

})