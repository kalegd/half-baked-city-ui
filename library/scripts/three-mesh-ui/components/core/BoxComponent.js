/*
	Job: Handle everything related to a BoxComponent element dimensioning and positioning
	Knows: Parents and children dimensions and positions
*/

import InlineManager from './InlineManager.js';

function BoxComponent() {

	const boxComponent = Object.create( InlineManager() );

	boxComponent.type = 'BoxComponent'

	boxComponent.isBoxComponent = true;

	boxComponent.childrenPos = {};

	// Get size of this component inside padding

	boxComponent.getInnerWidth = function GetInnerWidth() {

		const DIRECTION = this.getContentDirection();

		switch ( DIRECTION ) {

			case 'row' :
			case 'row-reverse' :
				return this.width - (this.padding * 2 || 0) || this.getChildrenSideSum( 'width' );
				break;

			case 'column' :
			case 'column-reverse' :
				return this.getHighestChildSizeOn( 'width' )
				break;

			default :
				console.error(`Invalid contentDirection : ${ DIRECTION }`);
				break;

		};

	};

	boxComponent.getInnerHeight = function GetInnerHeight() {

		const DIRECTION = this.getContentDirection();

		switch ( DIRECTION ) {

			case 'row' :
			case 'row-reverse' :
				return this.getHighestChildSizeOn( 'height' );
				break;

			case 'column' :
			case 'column-reverse' :
				return this.height - (this.padding * 2 || 0) || this.getChildrenSideSum( 'height' );
				break;

			default :
				console.error(`Invalid contentDirection : ${ DIRECTION }`);
				break;

		};

	};

	// Return the sum of all this component's children sides + their margin

	boxComponent.getChildrenSideSum = function GetChildrenSideSum( dimension ) {

		return this.children.reduce((accu, child)=> {

			if ( !child.isBoxComponent ) return accu

			const margin = (child.margin * 2) || 0;

			let CHILD_SIZE = (dimension === "width") ?
				(child.getWidth() + margin) :
				(child.getHeight() + margin);

			return accu + CHILD_SIZE;

		}, 0 );

	};

	// Look in parent record what is the instructed position for this component, then set its position

	boxComponent.setPosFromParentRecords = function SetPosFromParentRecords() {
		
		if ( this.getUIParent() && this.getUIParent().childrenPos[ this.id ] ) {

			this.position.x = ( this.getUIParent().childrenPos[ this.id ].x );
			this.position.y = ( this.getUIParent().childrenPos[ this.id ].y );

		};

	};

	// Position inner elements according to dimensions and layout parameters.

	boxComponent.computeChildrenPosition = function computeChildrenPosition() {

		if ( this.children.length > 0 ) {

			const DIRECTION = this.getContentDirection();
			let X_START, Y_START;

			switch ( DIRECTION ) {

				case 'row' :

					// start position of the children positioning inside this component
					X_START = this.getInnerWidth() / 2;

					this.setChildrenXPos( -X_START );

					this.alignChildrenOnY();

					break;

				case 'row-reverse' :
					
					// start position of the children positioning inside this component
					X_START = this.getInnerWidth() / 2;

					this.setChildrenXPos( X_START );

					this.alignChildrenOnY();

					break;

				case 'column' :
					
					// start position of the children positioning inside this component
					Y_START = this.getInnerHeight() / 2;

					this.setChildrenYPos( Y_START );

					this.alignChildrenOnX();

					break;

				case 'column-reverse' :
					
					// start position of the children positioning inside this component
					Y_START = this.getInnerHeight() / 2;

					this.setChildrenYPos( -Y_START );

					this.alignChildrenOnX();

					break;

			};

		};

	};

	// Set children positions according to this component dimension and attributes

	boxComponent.setChildrenXPos = function setChildrenXPos( startPos ) {

		const JUSTIFICATION = this.getJustifyContent();

		if ( JUSTIFICATION !== 'center' && JUSTIFICATION !== 'start' && JUSTIFICATION !== 'end' ) {
			console.warn(`justifiyContent === '${ JUSTIFICATION }' is not supported`);
		};

		this.children.reduce( (accu, child, i)=> {

			if ( !child.isBoxComponent ) return accu

			const CHILD_ID = child.id;
			const CHILD_WIDTH = child.getWidth();
			const CHILD_MARGIN = child.margin || 0;

			accu += CHILD_MARGIN * -Math.sign( startPos );

			this.childrenPos[ CHILD_ID ] = {
				x: accu + ((CHILD_WIDTH / 2) * -Math.sign( startPos )),
				y: 0
			};

			return accu + (-Math.sign( startPos ) * (CHILD_WIDTH + CHILD_MARGIN))

		}, startPos );

		//

		if ( JUSTIFICATION === "end" || JUSTIFICATION === "center" ) {

			let offset = (startPos * 2) - (this.getChildrenSideSum('width') * Math.sign(startPos));

			if ( JUSTIFICATION === "center" ) offset /= 2;
			
			this.children.forEach( (child)=> {

				if ( !child.isBoxComponent ) return

				this.childrenPos[ child.id ].x -= offset

			});

		};

	};

	//

	boxComponent.setChildrenYPos = function setChildrenYPos( startPos ) {

		const JUSTIFICATION = this.getJustifyContent();

		this.children.reduce( (accu, child, i)=> {

			if ( !child.isBoxComponent ) return accu

			const CHILD_ID = child.id;
			const CHILD_HEIGHT = child.getHeight();
			const CHILD_MARGIN = child.margin || 0;

			accu += CHILD_MARGIN * -Math.sign( startPos );

			this.childrenPos[ CHILD_ID ] = {
				x: 0,
				y: accu + ((CHILD_HEIGHT / 2) * -Math.sign( startPos ))
			};

			return accu + (-Math.sign( startPos ) * (CHILD_HEIGHT + CHILD_MARGIN))

		}, startPos );

		//

		if ( JUSTIFICATION === "end" || JUSTIFICATION === "center" ) {

			let offset = (startPos * 2) - (this.getChildrenSideSum('height') * Math.sign(startPos));
			
			if ( JUSTIFICATION === "center" ) offset /= 2;

			this.children.forEach( (child)=> {

				if ( !child.isBoxComponent ) return

				this.childrenPos[ child.id ].y -= offset

			});

		};

	};

	//

	boxComponent.alignChildrenOnX = function alignChildrenOnX() {

		const ALIGNMENT = this.getAlignContent();
		const X_TARGET = (this.getWidth() / 2) - (this.padding || 0);

		if ( ALIGNMENT !== "center" && ALIGNMENT !== "right" && ALIGNMENT !== "left" ) {
			console.warn(`contentAlign === '${ ALIGNMENT }' is not supported on this direction.`)
		};

		this.children.forEach( (child)=> {

			if ( !child.isBoxComponent ) return

			if ( ALIGNMENT === "right" ) {

				var offset = X_TARGET - (child.getWidth() / 2) - (child.margin || 0) ;

			} else if ( ALIGNMENT === "left" ) {

				var offset = -X_TARGET + (child.getWidth() / 2) + (child.margin || 0) ;

			};

			this.childrenPos[ child.id ].x = offset || 0;

		});

	};

	//

	boxComponent.alignChildrenOnY = function alignChildrenOnY() {

		const ALIGNMENT = this.getAlignContent();
		const Y_TARGET = (this.getHeight() / 2) - (this.padding || 0);

		if ( ALIGNMENT !== "center" && ALIGNMENT !== "top" && ALIGNMENT !== "bottom" ) {
			console.warn(`contentAlign === '${ ALIGNMENT }' is not supported on this direction.`)
		};

		this.children.forEach( (child)=> {

			if ( !child.isBoxComponent ) return

			if ( ALIGNMENT === "top" ) {

				var offset = Y_TARGET - (child.getHeight() / 2) - (child.margin || 0) ;

			} else if ( ALIGNMENT === "bottom" ) {

				var offset = -Y_TARGET + (child.getHeight() / 2) + (child.margin || 0) ;

			};

			this.childrenPos[ child.id ].y = offset || 0;

		});

	};

	// Returns the highest linear dimension among all the children of the passed component
	// MARGIN INCLUDED

	boxComponent.getHighestChildSizeOn = function getHighestChildSizeOn( direction ) {

		return this.children.reduce((accu, child)=> {

			if ( !child.isBoxComponent ) return accu

			const margin = child.margin || 0;
			let maxSize = direction === "width" ?
				child.getWidth() + (margin * 2) :
				child.getHeight() + (margin * 2) ;

			return Math.max(accu, maxSize)

		}, 0 );

	};

	// Get dimensions of this element
	// With padding, without margin

	boxComponent.getWidth = function getWidth() {
		return this.width || this.getInnerWidth() + (this.padding * 2 || 0);
	};

	boxComponent.getHeight = function getHeight() {
		return this.height || this.getInnerHeight() + (this.padding * 2 || 0);
	};

	//

	return boxComponent

};

export default BoxComponent