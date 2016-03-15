tcmd gulp run-minerva
wait-on tcp:6800
tcmd gulp run-barista
wait-on tcp:3400
tcmd gulp run-noctua
wait-on tcp:8910
tcmd gulp watch
open http://localhost:8910

