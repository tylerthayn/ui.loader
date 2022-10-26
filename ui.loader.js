/**
* @module @tyler.thayn/ui.loader
*/
define(['@js/core', 'jquery'], (core, $) => {

	let defaults = {
		auto: false,
		root: '',
		selector: 'view',
		scripts: true,
		styles: true
	}

	let id = 0;
	function Id () {
		return (++id).toString()
	}


	function LoadElement (element, options) {
		return new Promise((resolve, reject) => {
			options = Extend({}, defaults, options)
			let src = $(element).attr('src')
			$.get(src, res => {
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

				Promise.all(
					$(asset.elements[0]).find(options.selector).toArray().map(e => {
						return LoadElement(e, options)
					})
				).then(() => {
					$(asset.elements[0]).data('asset', asset)
					$(element).replaceWith(asset.elements[0])
					LoadScripts(asset, options).then(resolve).catch(reject)
				}).catch(reject)
			})
		})
	}

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
						let fn = new Function('$', $(script).text())
						return resolve(fn.call(asset.elements[0], $))
					} else {
						return resolve()
					}
				}
			})
		}))
	}

	Object.Extensions.UiLoader = function ($this, options = {}) {
		if (typeof $this !== 'object') {throw new Error('Non-object provided')}
		$this._loaderOptions = Extend({}, defaults, options)


		Define($this, 'LoadUi', function (options = {}) {
			options = Extend({}, this._loaderOptions, options)
			return Promise.all(
				$(options.selector).toArray().map(e => {
					return LoadElement(e, options)
				})
			)
		})

		if ($this._loaderOptions.auto) {
			$(() => {
				$this.LoadUi()
			})
		}

		return $this
	}

})
