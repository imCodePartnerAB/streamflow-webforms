/**
 *
 * Copyright 2009-2010 Streamsource AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package se.streamsource.surface.web.assembler;

import java.util.prefs.Preferences;

import org.qi4j.api.common.Visibility;
import org.qi4j.api.structure.Application;
import org.qi4j.bootstrap.ApplicationAssembler;
import org.qi4j.bootstrap.ApplicationAssembly;
import org.qi4j.bootstrap.ApplicationAssemblyFactory;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.LayerAssembly;
import org.qi4j.bootstrap.ModuleAssembly;
import org.qi4j.entitystore.memory.MemoryEntityStoreService;
import org.qi4j.entitystore.prefs.PreferencesEntityStoreInfo;
import org.qi4j.entitystore.prefs.PreferencesEntityStoreService;
import org.qi4j.library.jmx.JMXAssembler;

import se.streamsource.dci.restlet.client.ClientAssembler;
import se.streamsource.surface.web.config.ExternalCssConfiguration;
import se.streamsource.surface.web.mypages.MyPagesAccessConfiguration;
import se.streamsource.surface.web.mypages.MyPagesAccessFilterService;
import se.streamsource.surface.web.proxy.ProxyConfiguration;
import se.streamsource.surface.web.proxy.ProxyService;
import se.streamsource.surface.web.rest.ClientConfiguration;
import se.streamsource.surface.web.rest.ClientService;
import se.streamsource.surface.web.rest.IndexRestletService;

public class SurfaceWebAssembler
        implements ApplicationAssembler
{
   private Object[] serviceObjects;

   public SurfaceWebAssembler(Object... serviceObjects)
   {
      this.serviceObjects = serviceObjects;
   }

   public ApplicationAssembly assemble(ApplicationAssemblyFactory applicationFactory) throws AssemblyException
   {
      ApplicationAssembly assembly = applicationFactory.newApplicationAssembly();
      assembly.setName("Surface");
      assembly.setVersion("0.3.20.962");
      LayerAssembly webLayer = assembly.layer("Web");
      LayerAssembly appLayer = assembly.layer("Application");
      LayerAssembly managementLayer = assembly.layer("Management");
      LayerAssembly configLayer = assembly.layer("Configuration");

      webLayer.uses(appLayer);
      appLayer.uses(configLayer);
      managementLayer.uses(webLayer, appLayer, configLayer);

      assembleWebLayer(webLayer);

      assembleAppLayer(appLayer);

      assembleConfigLayer(configLayer);

      assembleManagementLayer(managementLayer);

      for (Object serviceObject : serviceObjects)
      {
         assembly.setMetaInfo(serviceObject);
      }

      return assembly;
   }

   private void assembleManagementLayer(LayerAssembly managementLayer) throws AssemblyException
   {
      ModuleAssembly module = managementLayer.module("JMX");

      new JMXAssembler().assemble(module);
   }

   private void assembleConfigLayer(LayerAssembly configLayer) throws AssemblyException
   {
      ModuleAssembly module = configLayer.module("Configurations");

      module.entities(ClientConfiguration.class, ProxyConfiguration.class, MyPagesAccessConfiguration.class, ExternalCssConfiguration.class).visibleIn(Visibility.application);

      // Configuration store
      Application.Mode mode = module.layer().application().mode();
      if (mode.equals(Application.Mode.development))
      {
         // In-memory store
         module.services(MemoryEntityStoreService.class).visibleIn(Visibility.layer);
      } else if (mode.equals(Application.Mode.test))
      {
         // In-memory store
         module.services(MemoryEntityStoreService.class).visibleIn(Visibility.layer);
      } else if (mode.equals(Application.Mode.production))
      {
         // Preferences storage
         ClassLoader cl = Thread.currentThread().getContextClassLoader();
         Thread.currentThread().setContextClassLoader(null);
         Preferences node;
         try
         {
            node = Preferences.userRoot().node("streamsource/streamflow/surface");
         } finally
         {
            Thread.currentThread().setContextClassLoader(cl);
         }

         module.services(PreferencesEntityStoreService.class).setMetaInfo(new PreferencesEntityStoreInfo(node)).visibleIn(Visibility.layer);
      }
   }

   protected void assembleWebLayer(LayerAssembly webLayer) throws AssemblyException
   {
      ModuleAssembly restModule = webLayer.module("REST");
      new SurfaceRestAssembler().assemble(restModule);
      new SurfaceResourceAssembler().assemble(restModule);
      new ContextsAssembler().assemble(restModule);
      new ClientAssembler().assemble( restModule );

   }

   private void assembleAppLayer(LayerAssembly appLayer) throws AssemblyException
   {
      ModuleAssembly indexModule = appLayer.module( "Index" );
      indexModule.addServices( IndexRestletService.class ).
            visibleIn(Visibility.application).
            identifiedBy( "indexrestlet" ).
            taggedWith( "index" ).
            instantiateOnStartup();
      
      ModuleAssembly proxyModule = appLayer.module("Proxy");

      proxyModule.addServices(ProxyService.class).
              visibleIn(Visibility.application).
              identifiedBy("streamflowproxy").
              taggedWith("streamflow").
              instantiateOnStartup();

      proxyModule.addServices(ProxyService.class).
              visibleIn(Visibility.application).
              identifiedBy("eidproxy").
              taggedWith("eid").
              instantiateOnStartup();

      proxyModule.addServices(ClientService.class).
              identifiedBy("client").
              instantiateOnStartup().
              visibleIn(Visibility.application);

      ModuleAssembly myPages = appLayer.module("My Pages");
      
      myPages.addServices( MyPagesAccessFilterService.class ).
              visibleIn(Visibility.application).
              identifiedBy( "mypagesfilter" ).
              taggedWith( "mypages" ).
              instantiateOnStartup();
   }
}
