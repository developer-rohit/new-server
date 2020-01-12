$(function() {
	$('#carousel-zw').carouFredSel({
		auto: false,
		items: {
			visible: 1,
			start: 1
		}
	});
	$('#carousel-txt').carouFredSel({
		auto: false,
		items: 1,
		scroll: {
			fx: 'fade',
			duration: 2000
		}
	});
	$('#carousel-fc').carouFredSel({
		synchronise: [ ['#carousel-zw'], ['#carousel-txt', false] ],
		items: 1,
		scroll: {
			duration: 1000,
			timeoutDuration: 3000
		},
		prev: '#prev',
		next: '#next'
	});
});