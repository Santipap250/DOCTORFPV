def test_app_firmware_cli_routing(client):
    common={"size":"5","battery":"4S","style":"freestyle","weight":"700","prop_size":"5","pitch":"4","blades":"3","motor_kv":"2306","motor_count":"4"}
    expectations={"3.5.7":("Betaflight &lt; 4.0","gyro_lowpass2_hz"),"4.2.11":("Betaflight 4.0.x–4.2.x","dyn_notch_max_hz"),"4.4.3":("Betaflight 4.3.0+","gyro_lpf2_static_hz")}
    for version,(label,marker) in expectations.items():
        r=client.get("/app",query_string=dict(common,bf_version=version))
        assert r.status_code==200
        body=r.get_data(as_text=True)
        assert label in body
        assert marker in body

def test_app_defaults_to_modern_firmware(client):
    r=client.get("/app?size=5&battery=4S&style=freestyle&weight=700&prop_size=5&pitch=4&blades=3")
    assert r.status_code==200
    body=r.get_data(as_text=True)
    assert "Betaflight 4.3.0+" in body
    assert "gyro_lpf2_static_hz" in body
