////
//// A take off from:
////  https://raw2.github.com/sporritt/jsPlumb/master/src/connectors-bezier.js
////
//// To cease using this experiment, revert the jsPlumb "Sugiyama"
//// arguments to "Bezier" and remove this file from app_base and
//// server.js.
////

(function() {

     var Sugiyama = function(params) {
         params = params || {};
	 
    	 var self = this;
	 var _super =
	     jsPlumb.Connectors.AbstractConnector.apply(this, arguments);
         var stub = params.stub || 50;
         var majorAnchor = params.curviness || 150;
         var minorAnchor = 10;

         this.type = "Sugiyama";	
         this.getCurviness = function() {
	     return majorAnchor;
	 };
        
         this._findControlPoint = function(point, sourceAnchorPosition, targetAnchorPosition, sourceEndpoint, targetEndpoint) {

             // Determine if the two anchors are perpendicular to each
             // other in their orientation. We swap the control
             // points around if so (code could be tightened up).
             var soo = sourceEndpoint.anchor.getOrientation(sourceEndpoint);
             var too = targetEndpoint.anchor.getOrientation(targetEndpoint);
             var perpendicular = soo[0] != too[0] || soo[1] == too[1];
             var p = [];
             
             if( ! perpendicular ){
                 if( soo[0] === 0 ){ // X

		     if( sourceAnchorPosition[0] < targetAnchorPosition[0] ){
			 p.push(point[0] + minorAnchor);
		     }else{
			 p.push(point[0] - minorAnchor);
		     }
                 }else{
		     p.push(point[0] - (majorAnchor * soo[0]));
                 }

                 if( soo[1] === 0 ){ // Y
		     
		     if( sourceAnchorPosition[1] < targetAnchorPosition[1] ){
			 p.push(point[1] + minorAnchor);
		     }else{
			 p.push(point[1] - minorAnchor);
		     }
                 }else{
		     p.push(point[1] + (majorAnchor * too[1]));
		 }
             }else{
                 if( too[0] === 0 ){ // X

		     if( targetAnchorPosition[0] < sourceAnchorPosition[0] ){
			 p.push(point[0] + minorAnchor);
		     }else{
			 p.push(point[0] - minorAnchor);
		     }
                 }else{
		     p.push(point[0] + (majorAnchor * too[0]));
                 }

                 if( too[1] === 0 ){ // Y

		     if( targetAnchorPosition[1] < sourceAnchorPosition[1] ){
			 p.push(point[1] + minorAnchor);
		     }else{
			 p.push(point[1] - minorAnchor);
		     }
                 }else{
		     p.push(point[1] + (majorAnchor * soo[1]));
		 }
             }
	     
             return p;                
         };        
	 
         this._compute = function(paintInfo, p) {
	     var sp = p.sourcePos,
	     tp = p.targetPos,				
             _w = Math.abs(sp[0] - tp[0]),
             _h = Math.abs(sp[1] - tp[1]),            
             _sx = sp[0] < tp[0] ? _w : 0,
             _sy = sp[1] < tp[1] ? _h : 0,
             _tx = sp[0] < tp[0] ? 0 : _w,
             _ty = sp[1] < tp[1] ? 0 : _h,
             _CP = self._findControlPoint([_sx, _sy], sp, tp,
					  p.sourceEndpoint, p.targetEndpoint),
             _CP2 = self._findControlPoint([_tx, _ty], tp, sp,
					   p.targetEndpoint, p.sourceEndpoint);
	     
	     var seg_args = {
		 x1:_sx, y1:_sy,
		 x2:_tx, y2:_ty,
		 cp1x:_CP[0], cp1y:_CP[1],
		 cp2x:_CP2[0], cp2y:_CP2[1]
	     };
	     _super.addSegment(this, "Bezier", seg_args);
         }; 
     };
     
     jsPlumb.registerConnectorType(Sugiyama, "Sugiyama");
     
 })();
