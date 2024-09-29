module.exports = (req, res, next) => {
    // console.log(req.cookies._prod_isLoggedIn, req.cookies._prod_isLoggedIn == undefined);
  // console.log(!req.session.prodToken && !req.user?.remember_token);
    if(req.cookies._prod_isLoggedIn == undefined) {
        return res.redirect("/");
    }
    else return next();
}