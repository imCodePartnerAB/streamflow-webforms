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
package se.streamsource.surface.web.proxy;

import org.qi4j.api.configuration.ConfigurationComposite;
import org.qi4j.api.configuration.Enabled;
import org.qi4j.api.property.Property;

/**
 * Configuration for proxy service
 */
public interface ProxyConfiguration
   extends ConfigurationComposite, Enabled
{
   Property<String> url();
   Property<String> username();
   Property<String> password();
}
