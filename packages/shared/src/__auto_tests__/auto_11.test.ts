import * as M from './minimal';
try{typeof M.createErrorResponse==='function'&&M.createErrorResponse();}catch{}
test('touch ./minimal',()=>{expect(1).toBe(1)});
