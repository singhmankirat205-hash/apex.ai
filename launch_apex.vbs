Option Explicit
Dim wshShell, fso, scriptDir, pythonwExe, runScript, edgeExe, url, i

Set wshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = "C:\Users\singh\.gemini\antigravity\scratch\apex-textile-chatbot"
pythonwExe = scriptDir & "\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(pythonwExe) Then
    pythonwExe = "pythonw.exe"
End If
runScript = scriptDir & "\run.py"
url = "http://127.0.0.1:5000"

Function CheckServer()
    CheckServer = False
    On Error Resume Next
    Err.Clear
    Dim req
    Set req = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If req Is Nothing Then
        Set req = CreateObject("MSXML2.XMLHTTP")
    End If
    req.Open "GET", "http://127.0.0.1:5000/api/health", False
    req.setTimeouts 500, 500, 500, 1000
    req.Send
    If Err.Number = 0 Then
        If req.Status = 200 Then
            CheckServer = True
        End If
    End If
    Set req = Nothing
    On Error GoTo 0
End Function

' 1. Start server if not running
If Not CheckServer() Then
    wshShell.CurrentDirectory = scriptDir
    
    ' Method A: Ask Windows Task Scheduler to start the decoupled background server
    On Error Resume Next
    wshShell.Run "schtasks /run /tn ""APEX_BackgroundServer""", 0, True
    On Error GoTo 0

    ' Method B: Direct fallback via pythonw if task scheduler hasn't bound port yet
    If Not CheckServer() Then
        wshShell.Run """" & pythonwExe & """ """ & runScript & """", 0, False
    End If

    ' Ensure Cloudflare tunnel is running in background
    On Error Resume Next
    wshShell.Run "schtasks /run /tn ""APEX_CloudflareTunnel""", 0, False
    On Error GoTo 0

    ' Poll until server is verified ready (up to 12 seconds)
    For i = 1 To 24
        WScript.Sleep 500
        If CheckServer() Then Exit For
    Next
End If

' 2. Launch in Edge App Mode (Dedicated standalone desktop window)
edgeExe = ""
If fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    edgeExe = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists("C:\Program Files\Microsoft\Edge\Application\msedge.exe") Then
    edgeExe = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If

If edgeExe <> "" Then
    Dim profileDir
    profileDir = scriptDir & "\data\app_profile"
    wshShell.Run """" & edgeExe & """ --app=" & url & " --window-size=1360,900 --user-data-dir=""" & profileDir & """", 1, False
Else
    wshShell.Run url, 1, False
End If
