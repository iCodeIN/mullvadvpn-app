package net.mullvad.mullvadvpn.ui.serviceconnection

import net.mullvad.mullvadvpn.model.Constraint
import net.mullvad.mullvadvpn.model.RelayConstraints
import net.mullvad.mullvadvpn.model.RelaySettings
import net.mullvad.mullvadvpn.relaylist.RelayItem
import net.mullvad.mullvadvpn.relaylist.RelayList
import net.mullvad.mullvadvpn.service.Event

class RelayListListener(eventDispatcher: EventDispatcher, val settingsListener: SettingsListener) {
    private var relayList: RelayList? = null
    private var relaySettings: RelaySettings? = null

    var selectedRelayItem: RelayItem? = null
        private set

    var onRelayListChange: ((RelayList, RelayItem?) -> Unit)? = null
        set(value) {
            field = value

            synchronized(this) {
                val relayList = this.relayList

                if (relayList != null) {
                    value?.invoke(relayList, selectedRelayItem)
                }
            }
        }

    init {
        eventDispatcher.registerHandler(Event.Type.NewRelayList) { event: Event.NewRelayList ->
            event.relayList?.let { relayLocations ->
                relayListChanged(RelayList(relayLocations))
            }
        }

        settingsListener.relaySettingsNotifier.subscribe(this) { newRelaySettings ->
            relaySettingsChanged(newRelaySettings)
        }
    }

    fun onDestroy() {
        settingsListener.relaySettingsNotifier.unsubscribe(this)
        onRelayListChange = null
    }

    private fun relaySettingsChanged(newRelaySettings: RelaySettings?) {
        synchronized(this) {
            val relayList = this.relayList

            relaySettings = newRelaySettings
                ?: RelaySettings.Normal(RelayConstraints(Constraint.Any()))

            if (relayList != null) {
                relayListChanged(relayList)
            }
        }
    }

    private fun relayListChanged(newRelayList: RelayList) {
        synchronized(this) {
            relayList = newRelayList
            selectedRelayItem = findSelectedRelayItem()

            onRelayListChange?.invoke(newRelayList, selectedRelayItem)
        }
    }

    private fun findSelectedRelayItem(): RelayItem? {
        val relaySettings = this.relaySettings

        when (relaySettings) {
            is RelaySettings.CustomTunnelEndpoint -> return null
            is RelaySettings.Normal -> {
                val location = relaySettings.relayConstraints.location

                return relayList?.findItemForLocation(location, true)
            }
        }

        return null
    }
}
