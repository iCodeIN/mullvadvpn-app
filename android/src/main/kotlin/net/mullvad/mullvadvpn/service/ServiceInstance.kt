package net.mullvad.mullvadvpn.service

import android.os.Messenger
import net.mullvad.talpid.ConnectivityListener

class ServiceInstance(
    val messenger: Messenger,
    val daemon: MullvadDaemon,
    val connectionProxy: ConnectionProxy,
    val connectivityListener: ConnectivityListener,
    val customDns: CustomDns,
    val settingsListener: SettingsListener,
    val splitTunneling: SplitTunneling
) {
    val accountCache = AccountCache(daemon, settingsListener)
    val keyStatusListener = KeyStatusListener(daemon)

    val locationInfoCache = LocationInfoCache(connectivityListener, settingsListener).apply {
        daemon = this@ServiceInstance.daemon
        stateEvents = connectionProxy.onStateChange
    }

    fun onDestroy() {
        accountCache.onDestroy()
        connectionProxy.onDestroy()
        customDns.onDestroy()
        keyStatusListener.onDestroy()
        locationInfoCache.onDestroy()
    }
}
