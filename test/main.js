requirejs.config({
	paths: {
		'@js/core': '../node_modules/@tyler.thayn/js.core/index',
		'jquery': '../node_modules/jquery/dist/jquery',
		'lodash': '../node_modules/lodash/lodash'
	}
})

require(['../ui.loader'], ($) => {

	let o = {}
	Object.Extensions.UiLoader(o)
	o.LoadUi().then(() => {
		log('loaded')
	}).catch(log)


})
