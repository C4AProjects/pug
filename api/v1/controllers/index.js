/**
 * Created by opips on 5/3/15.
 */
var pkg=require('../package.json');

exports.rootEndPoint=function(req,res) {
    //register root endpoint
    var rootEndPoint={
        version:pkg.api.version,
        description:pkg.description,
        documentation:pkg.documentation,
        modified:pkg.api.last_updated
    };
    res.send(rootEndPoint);
};