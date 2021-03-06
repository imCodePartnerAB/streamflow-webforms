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

package se.streamsource.surface.web.rest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.ServiceComposite;
import org.qi4j.api.service.qualifier.Tagged;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Uniform;
import org.restlet.data.MediaType;
import org.restlet.data.Reference;
import org.restlet.data.Status;

import se.streamsource.streamflow.util.Strings;
import se.streamsource.surface.web.config.ExternalCssConfiguration;

/**
 */
@Mixins(IndexRestletService.Mixin.class)
public interface IndexRestletService extends ServiceComposite, Configuration<ExternalCssConfiguration>
{
   public void handle(Request request, Response response);

   abstract class Mixin implements IndexRestletService
   {

      @Service
      @Tagged("eid")
      Uniform proxyService;

      @Service
      @Tagged("streamflow")
      Uniform streamflowService;

      @This
      Configuration<ExternalCssConfiguration> cssConfig;

      public void handle(Request request, Response response)
      {

         String accessPointId = request.getResourceRef().getQueryAsForm().getFirstValue( "ap" );

         if (accessPointId != null)
         {
            try
            {
               String template = getTemplate( "index.html", getClass() );

               template = template.replace( "$context-root", "/"
                     + request.getResourceRef().getBaseRef().getSegments().get( 0 ) );
               template = template.replace( "$accesspoint", accessPointId );
               template = template.replace( "$hostname", request.getResourceRef().getHostIdentifier() );
               String externalCssReplaceString = "";
               if (!Strings.empty( cssConfig.configuration().cssUrl().get())) {
                  externalCssReplaceString = "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + cssConfig.configuration().cssUrl().get() + "\" />"; 
               }
               template = template.replace( "$externalcss", externalCssReplaceString);
               
               response.setEntity( template, MediaType.TEXT_HTML );
            } catch (IOException e)
            {
               e.printStackTrace();
            }
         } else
         {
            response.setLocationRef( new Reference( request.getResourceRef(), "/"
                  + request.getResourceRef().getBaseRef().getSegments().get( 0 ) + "/surface/accesspoints/index" ) );
            response.setStatus( Status.REDIRECTION_TEMPORARY );
         }
      }

      public static String getTemplate(String resourceName, Class resourceClass) throws IOException
      {
         StringBuilder template = new StringBuilder( "" );
         InputStream in = resourceClass.getResourceAsStream( resourceName );
         BufferedReader reader = new BufferedReader( new InputStreamReader( in ) );
         String line;
         while ((line = reader.readLine()) != null)
            template.append( line + "\n" );
         reader.close();

         return template.toString();
      }
   }
}
