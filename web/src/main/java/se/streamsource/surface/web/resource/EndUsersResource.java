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

package se.streamsource.surface.web.resource;

import org.restlet.resource.ResourceException;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.server.CommandQueryResource;
import se.streamsource.dci.restlet.server.api.SubResources;
import se.streamsource.surface.web.context.EndUsersContext;

import static se.streamsource.dci.api.RoleMap.current;

/**
 * JAVADOC
 */
public class EndUsersResource
   extends CommandQueryResource
   implements SubResources
{
   public EndUsersResource( )
   {
      super( EndUsersContext.class );
   }

   public void resource( String segment ) throws ResourceException
   {
      current().set( current().get( CommandQueryClient.class ).getSubClient( segment ));
      subResource( EndUserResource.class );
   }
}
