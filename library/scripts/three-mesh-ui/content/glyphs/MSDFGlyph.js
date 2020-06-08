/*

Job: create a plane geometry with the right UVs to map the MSDF texture on the wanted glyph.
Knows: dimension of the plane to create, specs of the font used, glyph requireed

*/

import { PlaneBufferGeometry } from '../../../three/build/three.module.js';

export default function MSDFGlyph( inline, font ) {

	const char = inline.glyph;
	const fontSize = inline.fontSize;

	const geometry = new PlaneBufferGeometry( fontSize, fontSize );

	// Misc glyphs
	if ( char.match(/\s/g) === null ) {

		if ( font.info.charset.indexOf( char ) === -1 ) console.error(`The character '${ char }' is not included in the font characters set.`)

		mapUVs( geometry, font, char );

		transformGeometry( geometry, font, fontSize, char, inline );

	// White spaces (we don't want our plane geometry to have a visual width nor a height)
	} else {

		nullifyUVs( geometry );

		geometry.scale( 0, 0, 1 );
		geometry.translate( 0, fontSize / 2, 0 );

	};

	return geometry

};

// Compute the right UVs that will map the MSDF texture so that the passed character
// will appear centered in full size

function mapUVs( geometry, font, char ) {

	const charOBJ = font.chars.find( charOBJ => charOBJ.char === char );

	const common = font.common;

	const xMin = charOBJ.x / common.scaleW;

	const xMax = (charOBJ.x + charOBJ.width ) / common.scaleW;

	const yMin =  1 -((charOBJ.y + charOBJ.height ) / common.scaleH);

	const yMax = 1 - (charOBJ.y / common.scaleH);

	//

	const uvAttribute = geometry.attributes.uv;

	for ( var i = 0; i < uvAttribute.count; i ++ ) {

		var u = uvAttribute.getX( i );
		var v = uvAttribute.getY( i );

		[ u, v ] = (()=> {
			switch ( i ) {
			case 0 : return [ xMin, yMax ]
			case 1 : return [ xMax, yMax ]
			case 2 : return [ xMin, yMin ]
			case 3 : return [ xMax, yMin ]
			};
		})();

		uvAttribute.setXY( i, u, v );

	};

};

// Set all UVs to 0, so that none of the glyphs on the texture will appear

function nullifyUVs( geometry ) {

	const uvAttribute = geometry.attributes.uv;

	for ( var i = 0; i < uvAttribute.count; i ++ ) {

		uvAttribute.setXY( i, 0, 0 );

	};

};

// Gives the previously computed scale and offset to the geometry

function transformGeometry( geometry, font, fontSize, char, inline ) {

	const charOBJ = font.chars.find( charOBJ => charOBJ.char === char );

	const common = font.common;

	const newHeight = charOBJ.height / common.lineHeight;
	const newWidth = (charOBJ.width * newHeight) / charOBJ.height;

	geometry.scale(
		newWidth,
		newHeight,
		1
	);

	//

	geometry.translate(
		inline.width / 2,
		( inline.height / 2 ) - inline.anchor,
		0
	);

};
