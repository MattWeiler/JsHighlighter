/**
 * This library can be used to highlight visual DOM elements on the page.
 * 
 * Original Source: http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
 *   GitHub Source: https://github.com/infusion/JavaScript-Files/blob/master/pnglib.js
 */

/* BROWSER POLYFILLS */
/**
 * This POLYFILL will ensure that if the current browser
 * does not support the trim() prototype function on
 * strings, then it's added.
 */
if (!String.prototype.trim)
{
	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}

/**
 * This POLYFILL will ensure that if the current browser
 * does not support the console.debug(), console.info(),
 * console.warn() or console.error() functions, then
 * they're added.
 */
if (console && console.log)
{
	if (!console.debug)
	{
		console.debug = console.log;
	}
	if (!console.info)
	{
		console.info = console.log;
	}
	if (!console.warn)
	{
		console.warn = console.log;
	}
	if (!console.error)
	{
		console.error = console.log;
	}
}


/**
 * This function will create a new instance of a Highlighter.
 * 
 * @param configBlock
 * This JavaScript object can contain several attributes which
 * can be used to customize the look/feel of the highlighting
 * done by this Highlighter.
 * Attributes:
 *    backgroundRed       - The color-code (0 - 255) for the red
 *                          part of the background-color.
 *    backgroundGreen     - The color-code (0 - 255) for the green
 *                          part of the background-color.
 *    backgroundBlue      - The color-code (0 - 255) for the blue
 *                          part of the background-color.
 *    backgroundAlpha     - The color-code (0 - 255) for the alpha
 *                          part of the background-color.
 *    fillRed             - The color-code (0 - 255) for the red
 *                          part of the portal fill-color.
 *    fillGreen           - The color-code (0 - 255) for the green
 *                          part of the portal fill-color.
 *    fillBlue            - The color-code (0 - 255) for the blue
 *                          part of the portal fill-color.
 *    fillAlpha           - The color-code (0 - 255) for the alpha
 *                          part of the portal fill-color.
 *    radiusMultiplier    - The multiplier to be used to determine
 *                          the amount to multiply the radius by,
 *                          to give extra padding around each portal
 *                          Ex: 1.5 would make the radius 50% larger
 *                              than required to eclipse the DOM
 *                              elements.
 */
function Highlighter(configBlock)
{
	
	/* PUBLIC CONSTANTS */
	/**
	 * This stores the numeric value to denote
	 * logging-level of DEBUG.
	 */
	Highlighter.logLevel_debug = 0;
	/**
	 * This stores the numeric value to denote
	 * logging-level of INFO.
	 */
	Highlighter.logLevel_info = 1;
	/**
	 * This stores the numeric value to denote
	 * logging-level of WARNING.
	 */
	Highlighter.logLevel_warn = 2;
	/**
	 * This stores the numeric value to denote
	 * logging-level of ERROR.
	 */
	Highlighter.logLevel_error = 3;
	/**
	 * This stores the numeric value to denote
	 * the total number of milliseconds of no
	 * resizing that must pass before
	 * re-rendering the image.
	 */
	Highlighter.resizeDrawDelayMs = 200;
	
	
	/* PRIVATE VARIABLES */
	var resizeIndex = 0;
	var highlighting = false;
	var highlightPanel = null;
	var highlightObjects = null;
	var loggingLevel = Highlighter.logLevel_error;
	var backgroundRed = 0;
	var backgroundGreen = 0;
	var backgroundBlue = 0;
	var backgroundAlpha = 155;
	var fillRed = 0;
	var fillGreen = 0;
	var fillBlue = 0;
	var fillAlpha = 10;
	var radiusMultiplier = 1.75;
	
	
	/* PRIVATE FUNCTIONS */
	/**
	 * This function will verify the boolean output of
	 * the specified parameter.
	 * 
	 * @param value
	 * The boolean/string/number that represents a boolean
	 * value.
	 * If this is a string, 'true', 'yes', 'on' and '1'
	 * will all be considered true, anything else will be
	 * considered false.
	 * The comparison will be done in a case-insensitive
	 * manor.
	 * If this is a number, 1 will be considered true,
	 * anything else will be considered false.
	 * 
	 * @return
	 * The parsed boolean value or false if the specified
	 * value is not parsable.
	 */
	var verifyBoolean = function(value)
	{
		if ((typeof value === 'boolean') && (value !== null))
		{
			return (value === true);
		}
		else if ((typeof value === 'string') && (value !== null))
		{
			value = value.toLowerCase();
			
			return (value === 'true') || (value === 'yes') || (value === 'on') || (value === '1');
		}
		else if ((typeof value === 'number') && (value !== null))
		{
			value = Math.floor(value);
			
			return (value === 1);
		}
		
		return false;
	};
	
	/**
	 * This function will verify that the specified
	 * radius-multiplier value is within the acceptable
	 * range and return it if it is or return the
	 * default-value if it is not.
	 * 
	 * @param radiusMultiplier
	 * The radius-multiplier to verify.
	 * @param defaultValue
	 * The default radius-multiplier if the specified
	 * radius-multiplier is invalid.
	 * 
	 * @return
	 * The radius-multiplier specified or the default
	 * value if the specified value is not valid.
	 */
	var verifyRadiusMultiplier = function(radiusMultiplier, defaultValue)
	{
		if ((typeof radiusMultiplier === 'number') && (radiusMultiplier !== null))
		{
			return radiusMultiplier;
		}
		
		return defaultValue;
	};
	
	/**
	 * This function will verify that the specified color
	 * value is within the acceptable range and return it
	 * if it is or return the default-value if it is not.
	 * 
	 * @param color
	 * The color to verify.
	 * @param defaultValue
	 * The default color if the specified color is invalid.
	 * 
	 * @return
	 * The color specified or the default value if the
	 * specified value is not valid.
	 */
	var verifyColor = function(color, defaultValue)
	{
		if ((typeof color === 'number') && (color !== null) && (color >= 0) && (color <= 255))
		{
			return color;
		}
		
		return defaultValue;
	};
	
	/**
	 * This function will validate the logging-level
	 * passed-in.
	 * 
	 * @param loggingLevel
	 * The logging-level that should be used.
	 * This can either be the string representation
	 * (debug, info, warn, error) or the numeric value
	 * (Highlighter.logLevel_debug, Highlighter.logLevel_info, Highlighter.logLevel_warn, Highlighter.logLevel_error).
	 * @param defaultValue
	 * The default numeric logging-level if the specified
	 * logging-level is invalid.
	 * 
	 * @return
	 * The numeric logging-level that should be used.
	 */
	var verifyLoggingLevel = function(loggingLevel, defaultValue)
	{
		if ((typeof loggingLevel === 'string') && (loggingLevel !== null))
		{
			loggingLevel = loggingLevel.toLowerCase().trim();
			
			if ('debug' === loggingLevel)
			{
				return Highlighter.logLevel_debug;
			}
			else if ('info' === loggingLevel)
			{
				return Highlighter.logLevel_info;
			}
			else if ('warn' === loggingLevel)
			{
				return Highlighter.logLevel_warn;
			}
			else if ('error' === loggingLevel)
			{
				return Highlighter.logLevel_error;
			}
		}
		else if ((typeof loggingLevel === 'number') && (loggingLevel !== null))
		{
			loggingLevel = Math.floor(loggingLevel);
			
			if ((loggingLevel >= Highlighter.logLevel_debug) && (loggingLevel <= Highlighter.logLevel_error))
			{
				return loggingLevel;
			}
		}
		
		return defaultValue;
	};
	
	/**
	 * This function will draw a filled circle within the
	 * specified PNGlib for the dimensions specified.
	 * 
	 * @param pngImage
	 * The PNGlib to be drawn to.
	 * @param imageWidth
	 * The width of the image.
	 * @param imageHeight
	 * The height of the image.
	 * @param centerX
	 * The x-coordinate of the center of the circle in pixels.
	 * @param centerY
	 * The y-coordinate of the center of the circle in pixels.
	 * @param radius
	 * The radius in pixels.
	 * @param fillColor
	 * The color with which to fill the circle.
	 * - pngImage.color(...);
	 */
	var drawCircle = function(pngImage, imageWidth, imageHeight, centerX, centerY, radius, fillColor)
	{
		if ((typeof pngImage !== 'undefined') && (pngImage !== null))
		{
			var pixelX;
			var pixelY;
			
			for (var y=-radius; y<=radius; y++)
			{
				for (var x=-radius; x<=radius; x++)
				{
					// Only bother writing this pixel if it's
					// within the bounds of the expected circle.
					if ((x * x) + (y * y) <= (radius * radius))
					{
						pixelX = Math.floor(centerX + x);
						pixelY = Math.floor(centerY + y);
						
						// Only bother writing this pixel if it's
						// within the bounds of the image.
						if ((pixelX >= 0) && (pixelX < imageWidth) && (pixelY >= 0) && (pixelY < imageHeight))
						{
							pngImage.buffer[pngImage.index(pixelX, pixelY)] = fillColor;
						}
					}
				}
			}
			
			return true;
		}
		else
		{
			if (loggingLevel <= Highlighter.logLevel_error)
			{
				if ((typeof console !== 'undefined') && (console !== null) && (typeof console.error !== 'undefined') && (console.error !== null))
				{
					console.error('(Highlighter.drawCircle) PNGlib object was not specified.');
				}
			}
		}
		
		return false;
	};
	
	/**
	 * This function will build an image that is the size of
	 * the current window and place transparent holes within
	 * the image at the locations of the currently loaded
	 * objects to be highlighted.
	 */
	var buildHighlightImageUrl = function()
	{
		try
		{
			if ((typeof highlightObjects !== 'undefined') && (highlightObjects !== null) && (highlightObjects.length > 0))
			{
				var imageBuildStartTime = new Date();
				
				// Determine the size of the screen.
				var winWidth = Math.floor(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
				var winHeight = Math.floor(window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
				
				// Create the PNGlib object making it the size of the screen.
				var pngImage = new PNGlib(winWidth, winHeight, 256);
				
				// Set the background almost transparent.
				// In IE, if the background is transparent, then the mouse interactions pass-through.
				var backgroundColor = pngImage.color(backgroundRed, backgroundGreen, backgroundBlue, backgroundAlpha);
				var fillColor = pngImage.color(fillRed, fillGreen, fillBlue, fillAlpha);
				
				// Draw each portal on the image.
				var tmpClientRec;
				var tmpWidth;
				var tmpHeight;
				
				// Loop over each object that is to be highlighted and add them to the image.
				for (var n=0; n<highlightObjects.length; n++)
				{
					tmpClientRec = highlightObjects[n].getBoundingClientRect()
					
					if ((typeof tmpClientRec !== 'undefined') && (tmpClientRec !== null))
					{
						// For all major browsers and IE version 9+, the width and height attributes both exist.
						if ((typeof tmpClientRec.width !== 'undefined') && (tmpClientRec.width !== null) && (typeof tmpClientRec.height !== 'undefined') && (tmpClientRec.height !== null))
						{
							tmpWidth = tmpClientRec.width;
							tmpHeight = tmpClientRec.height;
						}
						// For IE8-, the width and height attributes don't exist.
						else
						{
							tmpWidth = tmpClientRec.right - tmpClientRec.left;
							tmpHeight = tmpClientRec.bottom - tmpClientRec.top;
						}
						
						var radius = Math.max(tmpWidth / 2, tmpHeight/ 2);
						radius = radius * radiusMultiplier;
						
						if (!drawCircle(pngImage, winWidth, winHeight, tmpClientRec.left + (tmpWidth / 2), tmpClientRec.top + (tmpHeight / 2), radius, fillColor))
						{
							// TODO: log the failure to create the portal ...
							
						}
					}
				}
				
				var imageBuildEndTime = new Date();
				
				var pngImageBase64 = pngImage.getBase64();
				
				var imageBase64EncodeEndTime = new Date();
				
				if (loggingLevel <= Highlighter.logLevel_debug)
				{
					if ((typeof console !== 'undefined') && (console !== null) && (typeof console.debug !== 'undefined') && (console.debug !== null))
					{
						console.debug('(buildHighlightImageUrl)                Image Size: (' + winWidth + ', ' + winHeight + ')');
						console.debug('(buildHighlightImageUrl)          Image Build Time: ' + (imageBuildEndTime.getTime() - imageBuildStartTime.getTime()) + 'ms');
						console.debug('(buildHighlightImageUrl)  Image Base64 Encode Time: ' + (imageBase64EncodeEndTime.getTime() - imageBuildEndTime.getTime()) + 'ms');
						console.debug('(buildHighlightImageUrl) Image Creation Total Time: ' + (imageBase64EncodeEndTime.getTime() - imageBuildStartTime.getTime()) + 'ms');
					}
				}
				
				return pngImageBase64;
			}
			else
			{
				if (loggingLevel <= Highlighter.logLevel_warn)
				{
					if ((typeof console !== 'undefined') && (console !== null) && (typeof console.warn !== 'undefined') && (console.warn !== null))
					{
						console.warn('(Highlighter.buildHighlightImageUrl) No DOM elements have been specified for highlighting.');
					}
				}
			}
		}
		catch (err)
		{
			if (loggingLevel <= Highlighter.logLevel_error)
			{
				if ((typeof console !== 'undefined') && (console !== null) && (typeof console.error !== 'undefined') && (console.error !== null))
				{
					console.error('(Highlighter.buildHighlightImageUrl) Image generation failed: ' + err);
				}
			}
		}
		
		return null;
	};
	
	/**
	 * This function will update the highlight image
	 * being displayed.
	 */
	var updateHighlight = function()
	{
		if (loggingLevel <= Highlighter.logLevel_info)
		{
			if ((typeof console !== 'undefined') && (console !== null) && (typeof console.info !== 'undefined') && (console.info !== null))
			{
				console.info('(Highlighter.updateHighlight) Updating highlighter.');
			}
		}
		
		var imageUrlBase64 = buildHighlightImageUrl();
		
		if ((typeof imageUrlBase64 === 'string') && (imageUrlBase64 !== null))
		{
			if ((typeof highlightPanel === 'undefined') || (highlightPanel === null))
			{
				highlightPanel = document.createElement('div');
				highlightPanel.setAttribute('class', 'highlightPanel');
			}
			
			if ((typeof highlightPanel.parentNode !== 'undefined') && (highlightPanel.parentNode !== null))
			{
				highlightPanel.parentNode.removeChild(highlightPanel);
			}
			
			highlightPanel.style.backgroundImage = 'url(\'data:image/png;base64,' + imageUrlBase64 + '\')';
			highlightPanel.style.backgroundColor = '';
			
			highlighting = true;
			
			document.getElementsByTagName('body')[0].appendChild(highlightPanel);
		}
		else
		{
			if (loggingLevel <= Highlighter.logLevel_error)
			{
				if ((typeof console !== 'undefined') && (console !== null) && (typeof console.error !== 'undefined') && (console.error !== null))
				{
					console.error('(Highlighter.updateHighlight) Failed to generate base64 image URL.');
				}
			}
		}
	};
	
	/**
	 * This function will perform the redraw on page resize.
	 * This function must be attached to the DOM upon display
	 * of the highlighter and remove it during the clearing.
	 */
	var windowResizeListener = function()
	{
		// If a highlight panel is attached to the DOM, then
		// clear its background-image and set its
		// background-color to the same static color as the
		// image.
		if ((typeof highlightPanel !== 'undefined') && (highlightPanel !== null))
		{
			if ((typeof highlightPanel.parentNode !== 'undefined') && (highlightPanel.parentNode !== null))
			{
				// Ensure that the highlight panel is
				// actually displaying the image.
				// If the user resizes the window a lot, we
				// don't need to bother clearing the
				// background-image and setting the
				// background-color again-and-again.
				if (highlighting === true)
				{
					highlighting = false;
					highlightPanel.style.backgroundImage = '';
					highlightPanel.style.backgroundColor = 'rgba(' + backgroundRed + ', ' + backgroundGreen + ', ' + backgroundBlue + ', ' + (backgroundAlpha / 255) + ')';
				}
			}
		}
		
		// Increment the global resize-index and store
		// it locally.
		resizeIndex++;
		var resizeIndex_local = resizeIndex;
		
		// Set a timeout to fire after a small period
		// of time to ensure that we only perform the
		// actual resize when the user is done resizing.
		setTimeout(function() {
			if (resizeIndex === resizeIndex_local)
			{
				updateHighlight();
			}
		}, Highlighter.resizeDrawDelayMs);
	};
	
	
	/* PUBLIC METHODS */
	/**
	 * This function will build an image URL that is the size
	 * of the current window and place transparent holes within
	 * the image at the locations of the specified objects to
	 * be highlighted.
	 * 
	 * @param highlightObjects
	 * The array of DOM elements that are to be highlighted.
	 */
	this.init = function(highlightObjs)
	{
		highlightObjects = highlightObjs;
		
		if (loggingLevel <= Highlighter.logLevel_debug)
		{
			if ((typeof console !== 'undefined') && (console !== null) && (typeof console.debug !== 'undefined') && (console.debug !== null))
			{
				console.debug('(Highlighter.init) Initialized highlighter with ' + ((highlightObjects && (highlightObjects !== null) && (highlightObjects.length > 0)) ? highlightObjects.length : 0) + ' DOM objects.');
			}
		}
		
		if (highlighting === true)
		{
			this.showHighlight();
		}
	};
	
	/**
	 * This function will clear the currently loaded objects
	 * and remove the highlight panel.
	 */
	this.clear = function()
	{
		if (loggingLevel <= Highlighter.logLevel_info)
		{
			if ((typeof console !== 'undefined') && (console !== null) && (typeof console.info !== 'undefined') && (console.info !== null))
			{
				console.info('(Highlighter.clear) Clearing highlighter.');
			}
		}
		
		if (window.detachEvent)
		{
			window.detachEvent('onresize', windowResizeListener);
		}
		else if (window.removeEventListener)
		{
			window.removeEventListener('resize', windowResizeListener);
		}
		else
		{
			if (loggingLevel <= Highlighter.logLevel_warn)
			{
				if ((typeof console !== 'undefined') && (console !== null) && (typeof console.warn !== 'undefined') && (console.warn !== null))
				{
					console.warn('(Highlighter.clear) Browser doesn\'t support JavaScript event binding.');
				}
			}
		}
		
		highlighting = false;
		highlightObjects = null;
		
		if ((typeof highlightPanel.parentNode !== 'undefined') && (highlightPanel.parentNode !== null))
		{
			highlightPanel.parentNode.removeChild(highlightPanel);
		}
	};
	
	/**
	 * This function will show the highlight panel and add
	 * a window-resize handler which will ensure that the
	 * highlight panel is kept up-to-date.
	 */
	this.showHighlight = function()
	{
		if (loggingLevel <= Highlighter.logLevel_info)
		{
			if ((typeof console !== 'undefined') && (console !== null) && (typeof console.info !== 'undefined') && (console.info !== null))
			{
				console.info('(Highlighter.showHighlight) Showing highlighter.');
			}
		}
		
		if (window.attachEvent)
		{
			window.attachEvent('onresize', windowResizeListener);
		}
		else if (window.addEventListener)
		{
			window.addEventListener('resize', windowResizeListener, true);
		}
		else
		{
			if (loggingLevel <= Highlighter.logLevel_warn)
			{
				if ((typeof console !== 'undefined') && (console !== null) && (typeof console.warn !== 'undefined') && (console.warn !== null))
				{
					console.warn('(Highlighter.clear) Browser doesn\'t support JavaScript event binding.');
				}
			}
		}
		
		updateHighlight();
	};
	
	
	/* CONSTRUCTOR LOGIC */
	if ((typeof configBlock !== 'object') || (configBlock === null))
	{
		configBlock = new Object();
	}
	
	loggingLevel = verifyLoggingLevel(configBlock['loggingLevel'], loggingLevel);
	backgroundRed = verifyColor(configBlock['backgroundRed'], backgroundRed);
	backgroundGreen = verifyColor(configBlock['backgroundGreen'], backgroundGreen);
	backgroundBlue = verifyColor(configBlock['backgroundBlue'], backgroundBlue);
	backgroundAlpha = verifyColor(configBlock['backgroundAlpha'], backgroundAlpha);
	fillRed = verifyColor(configBlock['fillRed'], fillRed);
	fillGreen = verifyColor(configBlock['fillGreen'], fillGreen);
	fillBlue = verifyColor(configBlock['fillBlue'], fillBlue);
	fillAlpha = verifyColor(configBlock['fillAlpha'], fillAlpha);
	radiusMultiplier = verifyRadiusMultiplier(configBlock['radiusMultiplier'], radiusMultiplier);
};
