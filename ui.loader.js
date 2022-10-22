/**
* @module @tyler.thayn/ui.loader
*/
define(['@js/core', 'jquery'], (core, $) => {

	let id = 0, loadedAssets = {}
	function Id () {return (++id).toString()}

	let defaults = {
		rootPath: '',
		defaultExtension: '.html',
		styles: {
			links: true,
			inline: true
		},
		scripts: {
			external: true,
			inline: true,
			context: 'element',
			args: {
				$: $
			}
		}
	}

	function Plugin ($this, options = {}) {
		if (typeof $this !== 'object') {throw new Error('Non-object provided')}
		if (!Reflect.has($this, 'on')) {Object.Extensions.EventEmitter($this)}

		Define($this, '_loaderOptions', Extend({}, defaults, options))

		Define($this, 'Load', function (...args) {
			return new Promise((resolve, reject) => {
				let cb = args.last instanceof Function ? args.pop() : Function.Noop
				let options = Extend({}, this._loaderOptions, Type(args.last, 'object') ? args.pop() : {})
				let id = args.shift()

				id = id.endsWith(this._loaderOptions.defaultExtension) ? id : id+this._loaderOptions.defaultExtension
				$.get(this._loaderOptions.rootPath+id, res => {
					let asset = {
						id: Id(),
						html: res,
						elements: [],
						scripts: [],
						styles: []
					}
					$(res).each((i, e) => {
						if (e instanceof Element) {
							if (e instanceof HTMLScriptElement) {
								asset.scripts.push(e)
							} else if (e instanceof HTMLLinkElement) {
								if (options.styles !== false && options.styles === true || options.styles.links === true) {
									$(e).data('id', asset.id)
									asset.styles.push(e)
									$('head').append(e)
								}
							} else if (e instanceof HTMLStyleElement) {
								if (options.styles !== false && options.styles === true || options.styles.inline === true) {
									$(e).data('id', asset.id)
									asset.styles.push(e)
									$('head').append(e)
								}
							} else if (e instanceof HTMLScriptElement) {
								asset.scripts.push(e)
							} else {
								asset.elements.push(e)
							}
						}
					})
					if (asset.elements.length < 1) {return reject(new Error('No elements available to load'))}
					LoadScripts(asset, options).then(() => {
						loadedAssets[asset.id] = asset
						$(asset.elements[0]).data('asset', asset.id)
						resolve($(asset.elements[0]))
					}).catch(reject)
				})
			})
		})

		function LoadScripts (asset, options) {
			if (options.scripts === false || asset.scripts.length < 1) {
				return new Promise((resolve, reject) => {resolve()})
			}
			return Promise.all(asset.scripts.map(script => {
				return new Promise((resolve, reject) => {
					if (Reflect.has(script, 'src') && script.src != '') {
						if (options.scripts === true || options.scripts.external === true) {
							$(script).on('load', resolve)
							$(script).on('error', reject)
						} else {
							return resolve()
						}
					} else {
						if (options.scripts === true || options.scripts.inline === true) {
							let context = options.scripts.context === 'element' ? asset.elements[0] : options.scripts.context
							let fn = new Function(...Object.keys(options.scripts.args), $(script).text())
							return resolve(fn.call(context, ...Object.values(options.scripts.args)))
						} else {
							return resolve()
						}
					}
				})
			}))
		}

		Define($this, 'UnLoad', (asset) => {
			if (typeof asset === 'string') {
				asset = loadedAssets[asset]
			} else if (asset instanceof $) {
				asset = loadedAssets[asset.data('asset')]
			} else if (asset instanceof HTMLElement) {
				asset = loadedAssets[$(asset).data('asset')]
			}

			$(asset.elements[0]).hide()
			try {asset.styles.forEach(style => {$(style).remove()})} catch (e) {}
			try {asset.scripts.filter(script => Reflect.has(script, 'src')).forEach(script => $(script).remove())} catch(e) {}
		})

		return $this
	}

	Define(Object.Extensions, 'UiLoader', Plugin)

	function Loader (options = {}) {
		Object.Extensions.EventEmitter(this)
		Object.Extensions.UiLoader(this)
		return this
	}

	$.extend({UiLoader: new Loader()})

	return Loader
})
