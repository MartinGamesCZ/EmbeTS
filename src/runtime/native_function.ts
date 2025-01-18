import { _, _transform } from ".";

const CODE = [
  _("duk_push_c_function(ctx, $1, $2)"),
  _("duk_put_global_string(ctx, $3)"),
];

export function NativeFunction(args: { [key: string]: string }) {
  return _transform(CODE, args);
}
