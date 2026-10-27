# Send a Wake-on-LAN packet to the TV from a device on the same LAN.
param(
    [Parameter(Mandatory=$true)][string]$MacAddress,
    [string]$BroadcastAddress = '192.168.1.255',
    [ValidateRange(1,65535)][int]$Port = 9,
    [Parameter(Mandatory=$true)][string]$TvAddress,
    [ValidateRange(1,65535)][int]$SshPort = 22,
    [ValidateRange(0,86400)][int]$TimeoutSeconds = 0
)

$ErrorActionPreference = 'Stop'
try {
    $taskMacHex = $MacAddress -replace '[:-]', ''
    if ($taskMacHex -notmatch '^[0-9a-fA-F]{12}$') {
        throw 'Invalid MAC address.'
    }
    $taskMacBytes = New-Object byte[] 6
    for ($taskIndex = 0; $taskIndex -lt 6; $taskIndex++) {
        $taskMacBytes[$taskIndex] = [Convert]::ToByte($taskMacHex.Substring($taskIndex * 2, 2), 16)
    }
    $taskPacket = New-Object byte[] 102
    for ($taskIndex = 0; $taskIndex -lt 6; $taskIndex++) {
        $taskPacket[$taskIndex] = 255
    }
    for ($taskIndex = 0; $taskIndex -lt 16; $taskIndex++) {
        [Array]::Copy($taskMacBytes, 0, $taskPacket, 6 + $taskIndex * 6, 6)
    }
    $taskUdp = New-Object System.Net.Sockets.UdpClient
    try {
        $taskUdp.EnableBroadcast = $true
        for ($taskIndex = 0; $taskIndex -lt 3; $taskIndex++) {
            [void]$taskUdp.Send($taskPacket, $taskPacket.Length, $BroadcastAddress, $Port)
            if ($taskIndex -lt 2) { Start-Sleep -Milliseconds 150 }
        }
    } finally {
        $taskUdp.Close()
    }
    Write-Host "Wake packet sent to TV ($MacAddress)."
    Write-Host "Waiting for TV SSH at ${TvAddress}:$SshPort ..."
    Write-Host 'The window stays open until SSH responds. Press Ctrl+C to cancel.'
    $taskWatch = [Diagnostics.Stopwatch]::StartNew()
    while ($true) {
        $taskSshReady = $false
        $taskTcp = New-Object System.Net.Sockets.TcpClient
        try {
            $taskConnect = $taskTcp.BeginConnect($TvAddress, $SshPort, $null, $null)
            try {
                if ($taskConnect.AsyncWaitHandle.WaitOne(2000)) {
                    $taskTcp.EndConnect($taskConnect)
                    $taskStream = $taskTcp.GetStream()
                    $taskStream.ReadTimeout = 2000
                    $taskBanner = New-Object System.IO.StreamReader($taskStream, [Text.Encoding]::ASCII)
                    try {
                        # Verify the SSH greeting, not just an open TCP port.
                        for ($taskLine = 0; $taskLine -lt 10; $taskLine++) {
                            $taskGreeting = $taskBanner.ReadLine()
                            if ($null -eq $taskGreeting) { break }
                            if ($taskGreeting.StartsWith('SSH-')) {
                                $taskSshReady = $true
                                break
                            }
                        }
                    } finally { $taskBanner.Dispose() }
                }
            } finally { $taskConnect.AsyncWaitHandle.Close() }
        } catch {
            # TV is still starting or its SSH service is not ready yet.
        } finally { $taskTcp.Close() }

        if ($taskSshReady) { break }
        if ($TimeoutSeconds -gt 0 -and $taskWatch.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
            throw "TV SSH did not become ready within $TimeoutSeconds seconds."
        }
        Write-Progress -Activity 'Waiting for TV to turn on' -Status ("SSH not ready - elapsed: {0}s" -f [int]$taskWatch.Elapsed.TotalSeconds)
        Start-Sleep -Seconds 2
    }
    Write-Progress -Activity 'Waiting for TV to turn on' -Completed
    Write-Host ("TV BAT THANH CONG - SSH is ready ({0}, {1}s)." -f $TvAddress, [int]$taskWatch.Elapsed.TotalSeconds) -ForegroundColor Green
    [void](Read-Host 'Press Enter to close')
} catch {
    Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
    [void](Read-Host 'Press Enter to close')
    exit 1
}
