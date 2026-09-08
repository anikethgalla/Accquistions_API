export const cookied = {
  getOptions : () => ({
    httpOnly:true,
    secure:process.env.NODE_ENV,
    sameSite: 'strict',
    maxAge:15*60*100
  }),

  set:(res,name,value,options={}) =>{
    res.cookie(name,value,{ ...cookieStore.getOptions(), ...getOptions});
  },

  clear: (res, name,options ={})=>{
    res.clearCookie(name,{ ...cookies.getOptions(), ...options});
  },

  get: (req,name)=>{
    return req.cookies[name];
  }


};