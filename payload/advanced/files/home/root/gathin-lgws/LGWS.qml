import QtQuick 2.4
import YSM.SystemUI 1.0
SystemUIComponent {
    id: root
    width: parent.width
    height: parent.height
    focus: false
    property var params: ({})
    function finish() { request({name:"finish"}); }
    function relaunched(p) { reveal.restart(); lifetime.restart(); }
    function aboutToClose(p) { finish(); }
    Rectangle {
        id: card
        x: 34; y: 32; width: 356; height: 88; radius: 20
        color: "#ecedf1"; border.width: 1; border.color: "#ffffff"
        opacity: 0
        Rectangle {
            x: 16; y: 18; width: 50; height: 50; radius: 14; color: "#25ad77"
            Text { anchors.centerIn: parent; text: "✓"; color: "white"; font.pixelSize: 32 }
        }
        Text { x: 82; y: 19; text: "LGWS Enable"; color: "#20242d"; font.pixelSize: 23; font.weight: Font.DemiBold }
        Text { x: 82; y: 49; text: "Privacy protection active"; color: "#616773"; font.pixelSize: 16 }
    }
    SequentialAnimation {
        id: reveal
        ParallelAnimation {
            NumberAnimation { target: card; property: "opacity"; from: 0; to: 1; duration: 220 }
            NumberAnimation { target: card; property: "y"; from: 16; to: 32; duration: 220; easing.type: Easing.OutCubic }
        }
        PauseAnimation { duration: 2560 }
        ParallelAnimation {
            NumberAnimation { target: card; property: "opacity"; to: 0; duration: 220 }
            NumberAnimation { target: card; property: "y"; to: 24; duration: 220 }
        }
    }
    Timer { id: lifetime; interval: 3000; onTriggered: root.finish() }
    Component.onCompleted: { reveal.start(); lifetime.start(); }
}
