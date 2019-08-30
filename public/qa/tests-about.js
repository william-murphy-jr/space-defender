suite('"About" Page Test', function() {
	test('page should contain link to contact page', function() {
		console.log('about before assert')
		assert($('a[href="/contact"]').length);
	});
});