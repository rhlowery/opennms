/*******************************************************************************
 * This file is part of OpenNMS(R).
 *
 * Copyright (C) 2006-2012 The OpenNMS Group, Inc.
 * OpenNMS(R) is Copyright (C) 1999-2012 The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is a registered trademark of The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * OpenNMS(R) is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with OpenNMS(R).  If not, see:
 *      http://www.gnu.org/licenses/
 *
 * For more information contact:
 *     OpenNMS(R) Licensing <license@opennms.org>
 *     http://www.opennms.org/
 *     http://www.opennms.com/
 *******************************************************************************/
package org.opennms.features.vaadin.dashboard.dashlets;

import com.vaadin.server.ExternalResource;
import com.vaadin.ui.BrowserFrame;
import com.vaadin.ui.Component;
import com.vaadin.ui.VerticalLayout;
import org.opennms.features.vaadin.dashboard.model.AbstractDashlet;
import org.opennms.features.vaadin.dashboard.model.Dashlet;
import org.opennms.features.vaadin.dashboard.model.DashletSpec;

/**
 * This class implements a {@link Dashlet} for displaying the topology map application.
 *
 * @author Christian Pape
 */
public class TopologyDashlet extends AbstractDashlet {

    private VerticalLayout m_verticalLayout;

    /**
     * Constructor for instantiating new objects.
     *
     * @param dashletSpec the {@link DashletSpec} to be used
     */
    public TopologyDashlet(String name, DashletSpec dashletSpec) {
        /**
         * Setting the member fields
         */
        m_name = name;
        m_dashletSpec = dashletSpec;
    }

    @Override
    public Component getDashboardComponent() {
        return getWallboardComponent();
    }

    @Override
    public Component getWallboardComponent() {
        if (m_verticalLayout == null) {
            m_verticalLayout=new VerticalLayout();
            /**
             * Setting up the layout
             */
            m_verticalLayout.setCaption(getName());
            m_verticalLayout.setSizeFull();

            String focusNodes = "";
            String szl = "";
            String provider = "";

            if (m_dashletSpec.getParameters().containsKey("focusNodes")) {
                focusNodes = m_dashletSpec.getParameters().get("focusNodes");
            }

            if (m_dashletSpec.getParameters().containsKey("szl")) {
                szl = m_dashletSpec.getParameters().get("szl");
            }

            if (m_dashletSpec.getParameters().containsKey("provider")) {
                provider = m_dashletSpec.getParameters().get("provider");
            }

            String query = "";

            if (!"".equals(focusNodes)) {
                query += "focusNodes=" + focusNodes + "&";
            }

            if (!"".equals(szl)) {
                query += "szl=" + szl + "&";
            }

            if (!"".equals(provider)) {
                query += "provider=" + provider + "&";
            }
            /**
             * creating browser frame to display node-maps
             */
            BrowserFrame browserFrame = new BrowserFrame(null, new ExternalResource("/opennms/topology?" + query));
            browserFrame.setSizeFull();
            m_verticalLayout.addComponent(browserFrame);

        }

        return m_verticalLayout;
    }
}
