/**
 *
 * Copyright
 * 2009-2015 Jayway Products AB
 * 2016-2018 Föreningen Sambruk
 *
 * Licensed under AGPL, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.gnu.org/licenses/agpl.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package se.streamsource.surface.web.rest;

import org.qi4j.api.injection.scope.Service;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;

/**
 */
public class IndexRestlet extends Restlet
{
   @Service
   IndexRestletService indexRestletService;
   
   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

      try
      {
         indexRestletService.handle( request, response );
      } catch (Exception e)
      {
         e.printStackTrace();
      }
   }

}
