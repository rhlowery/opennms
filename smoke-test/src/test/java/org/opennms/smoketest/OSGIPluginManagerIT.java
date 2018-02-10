/*******************************************************************************
 * This file is part of OpenNMS(R).
 *
 * Copyright (C) 2016 The OpenNMS Group, Inc.
 * OpenNMS(R) is Copyright (C) 1999-2016 The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is a registered trademark of The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * OpenNMS(R) is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OpenNMS(R).  If not, see:
 *      http://www.gnu.org/licenses/
 *
 * For more information contact:
 *     OpenNMS(R) Licensing <license@opennms.org>
 *     http://www.opennms.org/
 *     http://www.opennms.com/
 *******************************************************************************/
package org.opennms.smoketest;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

import java.io.IOException;

import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.HttpGet;
import org.junit.Test;
import org.opennms.core.resource.Vault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Simple checks to verify the REST endpoints provided
 * by the OSGi Plugin Manager are reachable.
 *
 * @author jwhite
 */
public class OSGIPluginManagerIT extends OpenNMSSeleniumTestCase {
    private static final Logger LOG = LoggerFactory.getLogger(OSGIPluginManagerIT.class);


    @Test
    public void canListProducts() throws ClientProtocolException, IOException, InterruptedException {
        assertEquals(Integer.valueOf(200), doRequest(new HttpGet(getBaseUrl() + "/opennms/licencemgr/rest/v1-0/product-pub/list")));
    }

    @Test
    public void canListFeatures() throws ClientProtocolException, IOException, InterruptedException {
        assertEquals(Integer.valueOf(200), doRequest(new HttpGet(getBaseUrl() + "/opennms/featuremgr/rest/v1-0/features-list")));
    }

    @Test
    public void canListPluginManifests() throws ClientProtocolException, IOException, InterruptedException {
        assertNotEquals(Integer.valueOf(404), doRequest(new HttpGet(getBaseUrl() + "/opennms/pluginmgr/rest/v1-0/manifest-list")));
    }

    @Test
    public void canAccessLicenseDiagnostics() throws ClientProtocolException, IOException, InterruptedException {
        assertEquals(Integer.valueOf(200), doRequest(new HttpGet(getBaseUrl() + "/opennms/licencemgr/diagnostics/licence-mgr-rest-diagnostics.html")));
    }

    @Test
    public void canAccessFeatureDiagnostics() throws ClientProtocolException, IOException, InterruptedException {
        assertEquals(Integer.valueOf(200), doRequest(new HttpGet(getBaseUrl() + "/opennms/featuremgr/diagnostics/feature-mgr-rest-diagnostics.html")));
    }

    @Test
    public void canAccessPluginDiagnostics() throws ClientProtocolException, IOException, InterruptedException {
        assertEquals(Integer.valueOf(200), doRequest(new HttpGet(getBaseUrl() + "/opennms/pluginmgr/diagnostics/plugin-mgr-rest-diagnostics.html")));
    }
    
    @Test
    public void canUnInstallAndUnInstallPlugin() throws ClientProtocolException, IOException, InterruptedException {
    	
        // install repository
    	String repository = getBaseUrl() 
       			+ "/opennms/pluginmgr/rest/v1-0/features-addrepositoryurl?uri=mvn:org.opennms.karaf/opennms/"
       			+ Vault.getProperty("version.display")+"/xml/features";
    	LOG.info("Smoke Test loading repository from "+repository);
       	assertEquals(Integer.valueOf(200), doRequest(new HttpGet(repository)));
        	
    	// install alarm-change-notifier plugin
       	String install = getBaseUrl() 
    			+ "/opennms/pluginmgr/rest/v1-0/features-install?name=alarm-change-notifier&version="+Vault.getProperty("version.display");
       	LOG.info("Smoke Test installing plugin from "+repository);
    	assertEquals(Integer.valueOf(200), doRequest(new HttpGet(install)));

    	// uninstall alarm-change-notifier plugin
    	String uninstall = getBaseUrl() 
    			+ "/opennms/pluginmgr/rest/v1-0/features-uninstall?name=alarm-change-notifier&version="+Vault.getProperty("version.display");
    	LOG.info("Smoke Test uninstalling plugin from "+repository);
    	assertEquals(Integer.valueOf(200), doRequest(new HttpGet(uninstall)));

    }
}
