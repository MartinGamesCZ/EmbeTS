import { _, _function, _if, _transform } from "..";

// TODO: Use better types
const CODE = [
  _function(
    "void",
    "bootLog",
    {
      "msg[]": "char",
    },
    [_('Serial.printf("\\e[30;47;1m BOOT \\e[0m %s\\n", msg)')]
  ),
  _function(
    "void",
    "runtimeLog",
    {
      "msg[]": "char",
    },
    [_('Serial.printf("\\e[30;44;1m RUNTIME \\e[0m %s\\n", msg)')]
  ),
  _function(
    "void",
    "errorLog",
    {
      msg: "String",
      logMsg: "bool",
    },
    [
      _('Serial.printf("\\e[30;41;1m ERROR \\e[0m ")'),
      _if("logMsg", [_('Serial.printf("%s", msg)')]),
    ]
  ),
];

export default function NativeUtilsFnLog() {
  return _transform(CODE, {});
}
