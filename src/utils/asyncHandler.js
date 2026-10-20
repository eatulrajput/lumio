// const asyncHandler = () => {}
// const asyncHandler = (fn) => {() => {}}
// const asyncHandler = (fn) => () => {}
// const asyncHandler = (fn) => async () => {}

//====================================================
//  Method to use through try and catch method
//====================================================

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

//====================================================
//  Method to use through Promise method
//===================================================

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
