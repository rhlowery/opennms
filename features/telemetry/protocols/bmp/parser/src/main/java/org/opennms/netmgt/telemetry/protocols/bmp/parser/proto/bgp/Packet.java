/*******************************************************************************
 * This file is part of OpenNMS(R).
 *
 * Copyright (C) 2019 The OpenNMS Group, Inc.
 * OpenNMS(R) is Copyright (C) 1999-2019 The OpenNMS Group, Inc.
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

package org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp;

import java.util.Optional;

import org.opennms.netmgt.telemetry.protocols.bmp.parser.InvalidPacketException;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp.packets.KeepalivePacket;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp.packets.NotificationPacket;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp.packets.OpenPacket;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp.packets.UnknownPacket;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bgp.packets.UpdatePacket;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bmp.PeerFlags;
import org.opennms.netmgt.telemetry.protocols.bmp.parser.proto.bmp.PeerInfo;

import io.netty.buffer.ByteBuf;

public interface Packet {
    void accept(final Visitor visitor);

    interface Parser {
        Packet parse(final Header header, final ByteBuf buffer, final PeerFlags flags, final Optional<PeerInfo> peerInfo) throws InvalidPacketException;
    }

    interface Visitor {
        void visit(final OpenPacket packet);
        void visit(final UpdatePacket packet);
        void visit(final NotificationPacket packet);
        void visit(final KeepalivePacket packet);
        void visit(final UnknownPacket packet);
    }

    static Packet parse(final ByteBuf buffer, final PeerFlags flags, final Optional<PeerInfo> peerInfo) throws InvalidPacketException {
        final Header header = new Header(buffer);
        return header.parsePayload(buffer, flags, peerInfo);
    }
}
